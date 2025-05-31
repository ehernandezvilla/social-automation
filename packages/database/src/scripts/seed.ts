import { postTemplateModel } from '../models/post-template';
import { closeDatabaseConnection } from '../connection';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Sample templates
    const sampleTemplates = [
      {
        title: "Tech Innovation Post",
        seoKeywords: ["technology", "innovation", "AI", "future"],
        context: "Create content about emerging technologies and their impact on business",
        targetAudience: "Tech professionals and entrepreneurs aged 25-45",
        links: ["https://example.com/tech-trends"],
        attachedDocs: [],
        needsImage: true,
        needsVideo: false,
        needsReview: true,
      },
      {
        title: "Motivational Monday",
        seoKeywords: ["motivation", "productivity", "success", "mindset"],
        context: "Weekly motivational content to inspire followers",
        targetAudience: "Young professionals seeking career growth",
        links: [],
        attachedDocs: [],
        needsImage: true,
        needsVideo: false,
        needsReview: false,
      },
    ];

    for (const template of sampleTemplates) {
      await postTemplateModel.create(template);
      console.log(`✅ Created template: ${template.title}`);
    }

    console.log('🎉 Database seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

export { seed };