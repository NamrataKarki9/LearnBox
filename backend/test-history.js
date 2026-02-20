import prisma from './src/prisma.js';

async function testQuizHistory() {
    try {
        console.log('Testing quiz history query...');
        
        // Test basic query
        const sessions = await prisma.quizSession.findMany({
            where: {
                status: 'SUBMITTED'
            },
            take: 5
        });
        
        console.log('✅ Basic query successful. Sessions found:', sessions.length);
        
        // Test with includes
        const sessionsWithIncludes = await prisma.quizSession.findMany({
            where: {
                status: 'SUBMITTED'
            },
            include: {
                set: {
                    select: { title: true }
                },
                module: {
                    select: { name: true, code: true }
                }
            },
            orderBy: { submittedAt: 'desc' },
            take: 5
        });
        
        console.log('✅ Query with includes successful. Sessions:', sessionsWithIncludes.length);
        console.log('Sample session:', JSON.stringify(sessionsWithIncludes[0], null, 2));
        
        // Test stats calculation
        const stats = {
            totalQuizzes: sessionsWithIncludes.length,
            averageScore: sessionsWithIncludes.length > 0
                ? (sessionsWithIncludes.reduce((sum, s) => sum + (s.score || 0), 0) / sessionsWithIncludes.length).toFixed(2)
                : 0,
            totalQuestions: sessionsWithIncludes.reduce((sum, s) => sum + s.totalQuestions, 0),
            totalCorrect: sessionsWithIncludes.reduce((sum, s) => sum + (s.correctAnswers || 0), 0)
        };
        
        console.log('✅ Stats calculation successful:', stats);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testQuizHistory();
