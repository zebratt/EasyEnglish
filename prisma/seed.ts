import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
    ssl: parsed.searchParams.get('ssl') === 'true',
  };
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 5,
  ssl: dbConfig.ssl ? true : undefined,
});
const prisma = new PrismaClient({ adapter });

const grammarTypes = [
  // 初级
  { name: '一般现在时', nameEn: 'Simple Present', level: 'BEGINNER' as const },
  { name: '一般过去时', nameEn: 'Simple Past', level: 'BEGINNER' as const },
  { name: '一般将来时', nameEn: 'Simple Future', level: 'BEGINNER' as const },
  { name: '现在进行时', nameEn: 'Present Continuous', level: 'BEGINNER' as const },
  { name: '被动语态', nameEn: 'Passive Voice', level: 'BEGINNER' as const },
  { name: '比较级与最高级', nameEn: 'Comparatives & Superlatives', level: 'BEGINNER' as const },
  { name: '基础条件句', nameEn: 'Basic Conditionals', level: 'BEGINNER' as const },
  // 中级
  { name: '现在完成时', nameEn: 'Present Perfect', level: 'INTERMEDIATE' as const },
  { name: '过去进行时', nameEn: 'Past Continuous', level: 'INTERMEDIATE' as const },
  { name: '过去完成时', nameEn: 'Past Perfect', level: 'INTERMEDIATE' as const },
  { name: '定语从句', nameEn: 'Relative Clauses', level: 'INTERMEDIATE' as const },
  { name: '状语从句', nameEn: 'Adverbial Clauses', level: 'INTERMEDIATE' as const },
  { name: '名词性从句', nameEn: 'Noun Clauses', level: 'INTERMEDIATE' as const },
  { name: '非谓语动词', nameEn: 'Non-finite Verbs', level: 'INTERMEDIATE' as const },
  // 高级
  { name: '现在完成进行时', nameEn: 'Present Perfect Continuous', level: 'ADVANCED' as const },
  { name: '过去完成进行时', nameEn: 'Past Perfect Continuous', level: 'ADVANCED' as const },
  { name: '将来完成时', nameEn: 'Future Perfect', level: 'ADVANCED' as const },
  { name: '虚拟语气', nameEn: 'Subjunctive Mood', level: 'ADVANCED' as const },
  { name: '倒装句', nameEn: 'Inverted Sentences', level: 'ADVANCED' as const },
  { name: '强调句', nameEn: 'Cleft Sentences', level: 'ADVANCED' as const },
  { name: '虚拟条件句', nameEn: 'Unreal Conditionals', level: 'ADVANCED' as const },
];

const sampleSentences: Record<string, string[]> = {
  '一般现在时': [
    '她每天早上六点起床。',
    '我的父亲在一家医院工作。',
    '地球围绕太阳转。',
    '他们每个周末都去公园散步。',
    '这家餐厅的食物总是很美味。',
  ],
  '一般过去时': [
    '昨天我在图书馆学习了三个小时。',
    '她上周去了北京出差。',
    '我们去年夏天在海边度过了一个愉快的假期。',
    '他小时候经常和爷爷一起钓鱼。',
    '那场电影让所有观众都感动得流泪了。',
  ],
  '定语从句': [
    '住在我隔壁的那个女孩是一名医生。',
    '这就是我昨天告诉你的那本书。',
    '他在一家生产电动汽车的公司工作。',
    '我永远不会忘记我们第一次见面的那一天。',
    '她是我见过的最善良的人。',
  ],
  '虚拟语气': [
    '如果我是你，我会接受这份工作。',
    '我希望我能说一口流利的英语。',
    '要是昨天没有下雨就好了。',
    '他说话的样子好像他什么都知道似的。',
    '如果当初我更努力学习，我现在就不会后悔了。',
  ],
};

async function main() {
  console.log('Seeding database...');

  for (const gt of grammarTypes) {
    const created = await prisma.grammarType.upsert({
      where: { id: grammarTypes.indexOf(gt) + 1 },
      update: {},
      create: gt,
    });

    const sentences = sampleSentences[gt.name];
    if (sentences) {
      for (const chinese of sentences) {
        await prisma.sentence.create({
          data: { grammarTypeId: created.id, chinese },
        });
      }
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
