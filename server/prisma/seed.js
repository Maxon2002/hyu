import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { menu } from "./data-menu.js"; // твой объект меню можно вынести в отдельный файл

async function main() {
  for (const [catIndex, category] of menu.entries()) {
    const createdCategory = await prisma.menuCategory.create({
      data: {
        slug: category.slug,
        position: catIndex,

        translations: {
          create: Object.entries(category.translations).map(([language, title]) => ({
            language,
            title
          }))
        },

        items: {
          create: category.items.map((item, itemIndex) => ({
            imageSmall: item.images.small,
            imageMedium: item.images.medium,
            imageLarge: item.images.large,
            position: itemIndex,

            translations: {
              create: Object.entries(item.translations).map(([language, t]) => ({
                language,
                title: t.title,
                description: t.description
              }))
            },

            variants: item.variants
              ? {
                  create: item.variants.map((variant, varIndex) => ({
                    price: variant.price,
                    showLabel:
                      typeof variant.showLabel === "boolean" ? variant.showLabel : true,
                    position: varIndex,

                    translations: {
                      create: Object.entries(variant.translations).map(
                        ([language, name]) => ({
                          language,
                          name
                        })
                      )
                    }
                  }))
                }
              : undefined
          }))
        }
      }
    });

    console.log(`✅ Created category: ${createdCategory.slug}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });