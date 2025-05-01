import "dotenv/config";
import { DataSource } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { Product } from "../product/entities/product.entity";
import { ProductColor } from "../product/entities/product-color.entity";
import { ProductImage } from "../product/entities/product-image.entity";
import { ProductManufacturer } from "../product/entities/product-manufacturer.entity";
import { ProductMaterial } from "../product/entities/product-material.entity";
import { CategoryEnum, TypeEnum, SizeEnum, SeasonEnum } from "../product/entities/enums/product.enum";

async function main() {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "postgres",
    entities: [Product, ProductColor, ProductImage, ProductManufacturer, ProductMaterial],
    synchronize: false,
    logging: false,
  });
  await dataSource.initialize();

  const manuRepo = dataSource.getRepository(ProductManufacturer);
  const prodRepo = dataSource.getRepository(Product);

  const sqlFilePath = path.resolve(process.cwd(), "products-temp.sql");
  const sql = fs.readFileSync(sqlFilePath, "utf-8");

  const insertIndex = sql.indexOf("INSERT INTO `products_1` VALUES");
  if (insertIndex < 0) {
    throw new Error("INSERT statement for products_1 not found");
  }

  const rows = extractValueTuples(sql.substring(insertIndex));
  console.log(`Found ${rows.length} product rows`);

  for (const row of rows) {
    const fields = parseTuple(row);
    const [
      id,
      manufacturerName,
      name,
      type,
      price,
      rating,
      ratingCount,
      imageUrl,
      detailUrl,
      description,
      category,
      colorMajor,
      colorSub,
      colorR,
      colorG,
      colorB,
      size,
      weightMin,
      weightMax,
      season,
      material,
      instructions,
    ] = fields;

    const manuDisplayName = stripQuotes(manufacturerName);
    let manufacturer: ProductManufacturer | null = null;
    if (manuDisplayName) {
      const existingManu = await manuRepo.findOneBy({ displayName: manuDisplayName });
      if (existingManu) {
        manufacturer = existingManu;
      } else {
        const newManu = manuRepo.create({ displayName: manuDisplayName });
        manufacturer = await manuRepo.save(newManu);
      }
    }

    const prod = prodRepo.create();
    prod.displayName = stripQuotes(name) || "";
    prod.description = stripQuotes(description) || "";
    if (manufacturer) prod.manufacturer = manufacturer;
    prod.price = parseFloat(price) || 0;
    prod.rating = parseFloat(rating) || 0;
    prod.reviews = parseInt(ratingCount, 10) || 0;
    const categoryStr = stripQuotes(category);
    if (categoryStr) {
      prod.category = categoryStr as CategoryEnum;
    } else {
      throw new Error(`Missing category for product row: ${row}`);
    }
    const typeStr = stripQuotes(type);
    if (typeStr) {
      prod.type = typeStr as TypeEnum;
    } else {
      throw new Error(`Missing type for product row: ${row}`);
    }

    // Colors
    const color = new ProductColor();
    color.major = stripQuotes(colorMajor) || "";
    color.sub = stripQuotes(colorSub) || "";
    color.r = colorR === "NULL" ? 0 : parseInt(colorR, 10);
    color.g = colorG === "NULL" ? 0 : parseInt(colorG, 10);
    color.b = colorB === "NULL" ? 0 : parseInt(colorB, 10);
    color.product = prod;
    prod.colors = [color];

    // Materials
    const matList = stripQuotes(material) || "";
    prod.materials = matList
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m)
      .map((mn) => {
        const pm = new ProductMaterial();
        pm.name = mn;
        pm.product = prod;
        return pm;
      });

    // Size
    const sizeStr = stripQuotes(size);
    if (sizeStr) {
      prod.size = sizeStr as SizeEnum;
    }

    // Weight range: use Postgres numrange literal
    if (weightMin !== "NULL" || weightMax !== "NULL") {
      const wMinNum = weightMin === "NULL" ? 0 : parseFloat(weightMin);
      const wMaxNum = weightMax === "NULL" ? 0 : parseFloat(weightMax);
      const rangeLiteral = `[${wMinNum},${wMaxNum}]`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prod as any).weightRange = rangeLiteral;
    }

    // Season
    const seasonStr = stripQuotes(season);
    if (seasonStr) {
      prod.season = seasonStr as SeasonEnum;
    }

    prod.instructions = stripQuotes(instructions) || "";

    // Images
    const url = stripQuotes(imageUrl);
    if (url) {
      const img = new ProductImage();
      img.url = url;
      img.description = "";
      img.product = prod;
      prod.images = [img];
    } else {
      prod.images = [];
    }

    await prodRepo.save(prod);
    console.log(`Imported product: ${prod.displayName}`);
  }

  console.log("Product migration complete");
  await dataSource.destroy();
}

/**
 * Extracts all top-level tuples from a VALUES section of a SQL INSERT.
 */
function extractValueTuples(sql: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let buffer = "";
  for (let i = sql.indexOf("("); i < sql.length; i++) {
    const char = sql[i];
    if (char === "(") {
      if (depth === 0) buffer = "";
      depth++;
      if (depth > 1) buffer += char;
    } else if (char === ")") {
      depth--;
      if (depth === 0) {
        tuples.push(buffer);
      } else {
        buffer += char;
      }
    } else {
      if (depth >= 1) buffer += char;
    }
  }
  return tuples;
}

/**
 * Splits a single tuple string into its comma-separated fields, respecting quotes.
 */
function parseTuple(tuple: string): string[] {
  const fields: string[] = [];
  let buffer = "";
  let inQuotes = false;
  for (let i = 0; i < tuple.length; i++) {
    const char = tuple[i];
    const prevChar = i > 0 ? tuple[i - 1] : "";
    if (char === "'" && prevChar !== "\\") {
      inQuotes = !inQuotes;
      buffer += char;
    } else if (char === "," && !inQuotes) {
      fields.push(buffer);
      buffer = "";
    } else {
      buffer += char;
    }
  }
  fields.push(buffer);
  return fields.map((f) => f.trim());
}

/**
 * Removes wrapping quotes and unescapes common sequences.
 */
function stripQuotes(value: string): string | null {
  if (!value || value === "NULL") {
    return null;
  }
  let result = value;
  if (value.startsWith("'") && value.endsWith("'")) {
    result = value
      .slice(1, -1)
      .replace(/\\'/g, "'")
      // eslint-disable-next-line no-useless-escape
      .replace(/\\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  // Trim leading/trailing whitespace
  return result.trim();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
