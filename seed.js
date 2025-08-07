const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  const categories = [
    {
      name: 'JARDINAGE',
      displayName: 'Jardinage',
      description: 'Outils et équipements pour le jardinage',
    },
    {
      name: 'BRICOLAGE',
      displayName: 'Bricolage',
      description: 'Outils et équipements pour le bricolage',
    },
    {
      name: 'TRANSPORT',
      displayName: 'Transport',
      description: 'Véhicules et équipements de transport',
    },
    {
      name: 'NETTOYAGE',
      displayName: 'Nettoyage',
      description: 'Outils et équipements de nettoyage',
    },
    {
      name: 'EVENEMENTIEL',
      displayName: 'Événementiel',
      description: 'Équipements pour événements et animations',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categories created');

  // Create subcategories
  const subcategories = [
    // Jardinage
    {
      name: 'gazon',
      displayName: 'Gazon',
      description: 'Outils pour l\'entretien du gazon',
      categoryName: 'JARDINAGE',
    },
    {
      name: 'terre',
      displayName: 'Terre',
      description: 'Outils pour travailler la terre',
      categoryName: 'JARDINAGE',
    },
    {
      name: 'bois',
      displayName: 'Bois',
      description: 'Outils pour travailler le bois',
      categoryName: 'JARDINAGE',
    },
    {
      name: 'arbre',
      displayName: 'Arbre',
      description: 'Outils pour l\'entretien des arbres',
      categoryName: 'JARDINAGE',
    },
    {
      name: 'feuilles',
      displayName: 'Feuilles',
      description: 'Outils pour ramasser les feuilles',
      categoryName: 'JARDINAGE',
    },

    // Bricolage
    {
      name: 'construction',
      displayName: 'Construction',
      description: 'Outils de construction',
      categoryName: 'BRICOLAGE',
    },
    {
      name: 'electricite',
      displayName: 'Électricité',
      description: 'Outils électriques',
      categoryName: 'BRICOLAGE',
    },
    {
      name: 'peinture',
      displayName: 'Peinture',
      description: 'Outils de peinture',
      categoryName: 'BRICOLAGE',
    },
    {
      name: 'vis-et-boulons',
      displayName: 'Vis et Boulons',
      description: 'Vis, boulons et fixations',
      categoryName: 'BRICOLAGE',
    },

    // Transport
    {
      name: 'charge-lourde',
      displayName: 'Charge Lourde',
      description: 'Équipements pour charges lourdes',
      categoryName: 'TRANSPORT',
    },
    {
      name: 'moteur',
      displayName: 'Moteur',
      description: 'Équipements motorisés',
      categoryName: 'TRANSPORT',
    },
    {
      name: 'roue',
      displayName: 'Roue',
      description: 'Équipements à roues',
      categoryName: 'TRANSPORT',
    },

    // Nettoyage
    {
      name: 'tissus',
      displayName: 'Tissus',
      description: 'Tissus et chiffons de nettoyage',
      categoryName: 'NETTOYAGE',
    },
    {
      name: 'eau',
      displayName: 'Eau',
      description: 'Équipements utilisant l\'eau',
      categoryName: 'NETTOYAGE',
    },
    {
      name: 'poussiere',
      displayName: 'Poussière',
      description: 'Équipements anti-poussière',
      categoryName: 'NETTOYAGE',
    },

    // Événementiel
    {
      name: 'son',
      displayName: 'Son',
      description: 'Équipements audio',
      categoryName: 'EVENEMENTIEL',
    },
    {
      name: 'eclairage',
      displayName: 'Éclairage',
      description: 'Équipements d\'éclairage',
      categoryName: 'EVENEMENTIEL',
    },
    {
      name: 'cuisine',
      displayName: 'Cuisine',
      description: 'Équipements de cuisine',
      categoryName: 'EVENEMENTIEL',
    },
    {
      name: 'animation-et-jeux',
      displayName: 'Animation et Jeux',
      description: 'Équipements d\'animation et jeux',
      categoryName: 'EVENEMENTIEL',
    },
    {
      name: 'decoration',
      displayName: 'Décoration',
      description: 'Équipements de décoration',
      categoryName: 'EVENEMENTIEL',
    },
    {
      name: 'mobilier',
      displayName: 'Mobilier',
      description: 'Mobilier d\'événement',
      categoryName: 'EVENEMENTIEL',
    },
    {
      name: 'structure',
      displayName: 'Structure',
      description: 'Structures d\'événement',
      categoryName: 'EVENEMENTIEL',
    },
  ];

  for (const subcategory of subcategories) {
    const category = await prisma.category.findUnique({
      where: { name: subcategory.categoryName },
    });

    if (category) {
      await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: subcategory.name,
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          name: subcategory.name,
          displayName: subcategory.displayName,
          description: subcategory.description,
          categoryId: category.id,
        },
      });
    }
  }

  console.log('✅ Subcategories created');

  // Create test users
  const users = [
    {
      email: 'john@example.com',
      password: '$2b$10$rQZ8NwYzX9vK2mN3pQ5rT7uI9oP1qR2sT3uV4wX5yZ6aA7bB8cC9dD0eE1fF',
      firstName: 'John',
      lastName: 'Doe',
      country: 'Kuwait',
      prefix: 'PLUS_965',
      phoneNumber: 12345678,
      verified_email: true,
      role: 'USER',
    },
    {
      email: 'jane@example.com',
      password: '$2b$10$rQZ8NwYzX9vK2mN3pQ5rT7uI9oP1qR2sT3uV4wX5yZ6aA7bB8cC9dD0eE1fF',
      firstName: 'Jane',
      lastName: 'Smith',
      country: 'KSA',
      prefix: 'PLUS_966',
      phoneNumber: 87654321,
      verified_email: true,
      role: 'USER',
    },
    {
      email: 'admin@bricolab.com',
      password: '$2b$10$rQZ8NwYzX9vK2mN3pQ5rT7uI9oP1qR2sT3uV4wX5yZ6aA7bB8cC9dD0eE1fF',
      firstName: 'Admin',
      lastName: 'User',
      country: 'UAE',
      prefix: 'PLUS_971',
      phoneNumber: 11111111,
      verified_email: true,
      role: 'ADMIN',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Test users created');

  // Create test tools
  const tools = [
    {
      title: 'Perceuse Bosch Professionnelle',
      description: 'Perceuse sans fil de qualité professionnelle, idéale pour tous types de travaux',
      brand: 'Bosch',
      model: 'PSB 1800 LI-2',
      year: 2023,
      pickupAddress: '123 Rue de la Paix, Paris 75001',
      ownerInstructions: 'Retourner avec batterie chargée et dans l\'état reçu',
      basePrice: 25.0,
      depositAmount: 100.0,
      publicationStatus: 'PUBLIE',
      availabilityStatus: 'DISPONIBLE',
      categoryName: 'BRICOLAGE',
      subcategoryName: 'electricite',
      ownerEmail: 'john@example.com',
      condition: 'BON',
    },
    {
      title: 'Tondeuse à gazon Honda',
      description: 'Tondeuse à gazon thermique Honda, parfaite pour les grands jardins',
      brand: 'Honda',
      model: 'HRG466',
      year: 2022,
      pickupAddress: '456 Avenue des Champs, Lyon 69000',
      ownerInstructions: 'Vérifier le niveau d\'huile avant utilisation',
      basePrice: 40.0,
      depositAmount: 200.0,
      publicationStatus: 'PUBLIE',
      availabilityStatus: 'DISPONIBLE',
      categoryName: 'JARDINAGE',
      subcategoryName: 'gazon',
      ownerEmail: 'jane@example.com',
      condition: 'BON',
    },
    {
      title: 'Camion de déménagement',
      description: 'Camion de déménagement avec hayon, capacité 3 tonnes',
      brand: 'Renault',
      model: 'Master',
      year: 2021,
      pickupAddress: '789 Boulevard Central, Marseille 13000',
      ownerInstructions: 'Présenter permis de conduire et assurance',
      basePrice: 80.0,
      depositAmount: 500.0,
      publicationStatus: 'PUBLIE',
      availabilityStatus: 'DISPONIBLE',
      categoryName: 'TRANSPORT',
      subcategoryName: 'charge-lourde',
      ownerEmail: 'john@example.com',
      condition: 'BON',
    },
  ];

  for (const tool of tools) {
    const category = await prisma.category.findUnique({
      where: { name: tool.categoryName },
    });

    const subcategory = await prisma.subcategory.findFirst({
      where: {
        name: tool.subcategoryName,
        categoryId: category.id,
      },
    });

    const owner = await prisma.user.findUnique({
      where: { email: tool.ownerEmail },
    });

    if (category && subcategory && owner) {
      await prisma.tool.create({
        data: {
          title: tool.title,
          description: tool.description,
          brand: tool.brand,
          model: tool.model,
          year: tool.year,
          pickupAddress: tool.pickupAddress,
          ownerInstructions: tool.ownerInstructions,
          basePrice: tool.basePrice,
          depositAmount: tool.depositAmount,
          publicationStatus: tool.publicationStatus,
          availabilityStatus: tool.availabilityStatus,
          categoryId: category.id,
          subcategoryId: subcategory.id,
          ownerId: owner.id,
          publishedAt: new Date(),
          moderatedAt: new Date(),
          condition: tool.condition || 'BON',
        },
      });
    }
  }

  console.log('✅ Test tools created');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 