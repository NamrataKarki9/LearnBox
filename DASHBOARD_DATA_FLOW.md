# StudentDashboard Data Flow Architecture

## Real-Time Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     STUDENT DASHBOARD                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Performance│  │Recent    │  │Weak      │  │Study     │       │
│  │Cards     │  │Sessions  │  │Areas     │  │Recs      │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┼─────────────┼─────────────┘              │
│                     │             │                            │
│         Uses analyticsAPI.getDashboard()                        │
│                     │             │                            │
└─────────────────────┼─────────────┼────────────────────────────┘
                      │             │
                      ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│          BACKEND ANALYTICS API /api/analytics/dashboard          │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Returns combined data structure:                           │  │
│ │  {                                                          │  │
│ │    overview: {PerformanceStats}                             │  │
│ │    weakAreas: [WeakPoints[0..4]]                            │  │
│ │    recommendations: {status, recommendations[0..4]}         │  │
│ │    recentActivity: [QuizSessions[0..9]]                     │  │
│ │    dailyProgress: [DailyStats[0..13]]                       │  │
│ │    modulePerformance: [ModuleStats[0..4]]                   │  │
│ │  }                                                          │  │
│ └────────────────────────────────────────────────────────────┘  │
└──┬───────────────────────────────────────────────────────────┬──┘
   │                                                            │
   ▼                                                            ▼
┌────────────────────────────┐  ┌──────────────────────────────────┐
│  getOverallStats()         │  │  getPracticeHistory()            │
│  ├─ totalAttempts          │  │  └─ recentSessions[]             │
│  ├─ correctAttempts        │  │     ├─ id, title                │
│  ├─ accuracy %             │  │     ├─ module, score             │
│  ├─ quizzesTaken           │  │     ├─ correctAnswers/total      │
│  ├─ averageQuizScore       │  │     ├─ submittedAt               │
│  └─ recentTrend            │  │     └─ timeSpent                 │
└────────────────┬───────────┘  └──────────────────┬───────────────┘
                 │                                  │
┌────────────────────────────────────────────────────────────────┐
│ getWeakPoints()                │  getRecommendations()         │
│ └─ WeakPoint[]                 │  └─ Recommendation[]           │
│    ├─ topic                    │     ├─ topic                   │
│    ├─ module                   │     ├─ priority (H/M/L)         │
│    ├─ difficulty               │     ├─ reason                   │
│    └─ accuracy %               │     └─ suggestedActions[]       │
└────────────────────────────────────────────────────────────────┘

                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ QuizSession      │  │Performance       │  │MCQ           │  │
│  │ ├─ studentId     │  │Analytics         │  │ ├─ id        │  │
│  │ ├─ setId         │  │ ├─ studentId     │  │ ├─ topic     │  │
│  │ ├─ submitted At  │  │ ├─ moduleId      │  │ ├─ module    │  │
│  │ ├─ score         │  │ ├─ topic         │  │ └─ diff      │  │
│  │ ├─ totalQuestions│  │ ├─ accuracy      │  │              │  │
│  │ ├─ correctAns    │  │ └─ lastAttempt   │  │ ┌──────────┐ │  │
│  │ └─ timeSpent     │  │                  │  │ │QuizAnswer│ │  │
│  │                  │  │ [Updated after   │  │ ├─ ansId   │ │  │
│  │ ┌──────────────┐ │  │  every quiz      │  │ ├─ correct │ │  │
│  │ │QuizAnswer    │ │  │  submission]     │  │ └─ student │ │  │
│  │ ├─ mcqId       │ │  │                  │  │            │ │  │
│  │ ├─ answerGiven│ │  │                  │  │            │ │  │
│  │ ├─ isCorrect  │ │  │                  │  │            │ │  │
│  │ └─ sessionId  │ │  │                  │  │            │ │  │
│  └──────────────┘ │  │                  │  │            │ │  │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │  │
└──────────────────────────────────────────────────────────────────┘

```

## Data Update Sequence (Timeline)

```
TIME 0s: Component Mount
├─ Initialize state (analyticsLoading = true)
├─ Call analyticsAPI.getDashboard()
├─ Receive analytics data
├─ Set all state variables
└─ analyticsLoading = false ✓

TIME 30s: Auto-Refresh Tick 1
├─ Call analyticsAPI.getDashboard() again
├─ Receive updated analytics data
└─ Update all state variables
   ├─ performanceStats (updated accuracy, new quiz count)
   ├─ recentSessions (new sessions added to top)
   ├─ weakAreas (recalculated based on new attempts)
   └─ recommendations (regenerated if needed)

TIME 60s: Auto-Refresh Tick 2
├─ Same process repeats...
└─ Dashboard reflects latest student activity

TIME 90s → CONTINUOUS
└─ Every 30 seconds, fresh data fetched and displayed
```

## Data State Management

```typescript
// State Variables (Frontend)
const [performanceStats, setPerformanceStats] = useState(null);
const [recentSessions, setRecentSessions] = useState([]);
const [weakAreas, setWeakAreas] = useState([]);
const [recommendations, setRecommendations] = useState([]);
const [modulePerformance, setModulePerformance] = useState([]);
const [dailyProgress, setDailyProgress] = useState([]);
const [analyticsLoading, setAnalyticsLoading] = useState(true);

// Effect Hooks
useEffect(() => {
  // On Component Mount: Fetch initial data
  fetchInitialData();
}, []);

useEffect(() => {
  // Auto-refresh: Every 30 seconds
  const interval = setInterval(refreshAnalytics, 30000);
  return () => clearInterval(interval);
}, []);
```

## Component Lifecycle & Real-Time Updates

```
┌─ USER OPENS DASHBOARD ─────────────┐
│                                     │
│ 1. Component Mounts                 │
│    └─ useEffect Hook 1 fires        │
│       └─ Fetch initial analytics    │
│          └─ Set all state           │
│             └─ Display data ✓       │
│                                     │
│ 2. Interval Started                 │
│    └─ useEffect Hook 2 fires        │
│       └─ setInterval(30000)         │
│                                     │
│ 3. Student Does Quizzes (tab 2)    │
│    ├─ Quiz 1: Completed 8/10       │
│    ├─ 5 mins later                  │
│    └─ Quiz 2: Completed 7/10       │
│                                     │
│ 4. Dashboard Auto-Refreshes         │
│    └─ At 30 second mark             │
│       └─ Fetch new analytics        │
│       └─ Update all state           │
│       └─ UI re-renders              │
│          ├─ New sessions appear     │
│          ├─ Score updated           │
│          ├─ Weak areas recalc       │
│          └─ Recommendations update  │
│                                     │
│ 5. Display Shows Live Data ✓        │
│    ├─ Accuracy: 75.3%               │
│    ├─ Recent: Quiz 2 just now       │
│    ├─ Focus: Recursion (42%)        │
│    ├─ Rec: "Practice recursion 1hr" │
│    └─ Time: "Just now"              │
└─────────────────────────────────────┘
```

## 🎯 Key Features

1. **Real-Time Updates**: Every 30 seconds
2. **No Manual Refresh**: Automatic background updates
3. **Database-Backed**: All data from actual quiz attempts
4. **Performance Calculated**: Server computes accuracy, trends
5. **Recommendations Smart**: Based on areas needing work
6. **Loading States**: User feedback while data loads
7. **Error Resilience**: Graceful handling of failed refreshes

## 📊 Data Aggregation on Backend

```
Raw Quiz Data (from database)
    ↓
Filter by student & date range
    ↓
Group by topic/difficulty
    ↓
Calculate accuracy % for each topic
    ↓
Identify topics < 60% accuracy
    ↓
Generate recommendations
    ↓
Format response for frontend
    ↓
Send to dashboard
```

## 🔄 Refresh Cycle Details

Each 30-second refresh:
1. **Request**: POST/GET to `/api/analytics/dashboard`
2. **Processing Time**: ~200-500ms backend processing
3. **Network Time**: ~100-200ms roundtrip
4. **Update**: State updated silently in background
5. **Re-render**: UI updates only sections with new data
6. **Total Impact**: No visible loading spinner (runs silently)

---

**Result**: Students see live, accurate performance data that updates automatically! 🚀
