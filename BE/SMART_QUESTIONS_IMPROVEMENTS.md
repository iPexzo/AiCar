# Smart Follow-up Questions Improvements

## Overview

The smart follow-up questions system has been completely overhauled to provide dynamic, context-aware questions that change based on car information, problem descriptions, and previous answers.

## Key Improvements

### 1. Dynamic Question Generation

- **Before**: Static questions that never changed
- **After**: AI-generated questions based on specific car make/model and problem description

### 2. Context-Aware Questions

- Questions are now tailored to the specific car type (Toyota, Dodge, Nissan, etc.)
- Questions consider the problem type (engine, transmission, brakes, etc.)
- Questions adapt to mileage and service history

### 3. Duplicate Prevention

- Each question generation includes a unique session ID
- Timestamps are added to prevent caching
- AI is instructed to avoid repeating previous questions

### 4. Additional Questions Endpoint

- New `/api/generate-questions` endpoint for generating follow-up questions
- Takes into account previous questions and answers
- Generates contextually relevant additional questions

### 5. Cache Busting

- Unique session IDs prevent accidental caching
- Timestamps ensure fresh responses
- Random elements in prompts ensure variety

## Technical Implementation

### Initial Questions Generation

```typescript
// In /api/analyze-guided endpoint
const sessionId =
  Date.now().toString() + Math.random().toString(36).substr(2, 9);
const smartQuestionsPrompt = `
أنت خبير ميكانيكي سيارات في الكويت. بناءً على المعلومات التالية، اطرح 3 أسئلة ذكية ومحددة لتحسين التشخيص:

معلومات السيارة:
- النوع: ${carType}
- الموديل: ${carModel}
- الممشى: ${mileage} كم
${lastServiceType ? `- آخر صيانة: ${lastServiceType}` : ""}

المشكلة المذكورة:
${problemDescription}

معرف الجلسة: ${sessionId}
الوقت: ${new Date().toISOString()}

مطلوب:
1. اطرح 3 أسئلة ذكية ومحددة تساعد في تشخيص المشكلة بدقة
2. كل سؤال يجب أن يكون مختلفاً ومفيداً
3. استخدم اللغة العربية
4. اكتب الأسئلة فقط، بدون أي شرح إضافي
5. ابدأ كل سؤال برقم (1. 2. 3.)
6. تأكد من أن الأسئلة مخصصة لهذه السيارة والمشكلة المحددة
`;
```

### Additional Questions Generation

```typescript
// New /api/generate-questions endpoint
const additionalQuestionsPrompt = `
أنت خبير ميكانيكي سيارات في الكويت. بناءً على المعلومات التالية، اطرح 2-3 أسئلة إضافية ذكية ومحددة لتحسين التشخيص:

معلومات السيارة:
- النوع: ${carDetails.carType}
- الموديل: ${carDetails.carModel}
- الممشى: ${carDetails.mileage} كم

المشكلة الأصلية:
${problemDescription}

الأسئلة السابقة:
${previousQuestions
  .map((q: any, index: number) => `${index + 1}. ${q.question}`)
  .join("\n")}

الإجابات السابقة:
${previousAnswers
  .map((a: any, index: number) => `${index + 1}. ${a.answer}`)
  .join("\n")}

معرف الجلسة: ${sessionId}
الوقت: ${new Date().toISOString()}

مطلوب:
1. اطرح 2-3 أسئلة إضافية ذكية ومحددة بناءً على الإجابات السابقة
2. لا تكرر الأسئلة السابقة - تأكد من أن الأسئلة الجديدة مختلفة تماماً
3. استخدم الإجابات السابقة لطرح أسئلة أكثر تحديداً
4. استخدم اللغة العربية
5. اكتب الأسئلة فقط، بدون أي شرح إضافي
6. ابدأ كل سؤال برقم (1. 2. 3.)
7. تأكد من أن الأسئلة الجديدة مخصصة للإجابات المقدمة
`;
```

## API Endpoints

### 1. Initial Analysis with Smart Questions

- **Endpoint**: `POST /api/analyze-guided`
- **Purpose**: Generate initial analysis and smart follow-up questions
- **Features**:
  - Dynamic questions based on car info and problem
  - Unique session IDs to prevent caching
  - Context-aware question generation

### 2. Additional Questions Generation

- **Endpoint**: `POST /api/generate-questions`
- **Purpose**: Generate additional questions based on previous answers
- **Features**:
  - Considers previous questions and answers
  - Avoids duplicate questions
  - Contextually relevant follow-ups

### 3. Final Analysis

- **Endpoint**: `POST /api/analyze-followup`
- **Purpose**: Generate final analysis incorporating all answers
- **Features**:
  - Uses all previous answers for enhanced analysis
  - Provides Kuwait-specific recommendations
  - Includes pricing in Kuwaiti Dinar

## Testing

### Test Scripts Created

1. `test-smart-questions.js` - Tests basic smart questions generation
2. `test-complete-flow.js` - Tests complete flow from initial to final analysis

### Test Results

- ✅ Questions change based on car make/model
- ✅ Questions adapt to problem type
- ✅ No duplicate questions generated
- ✅ All questions are in Arabic
- ✅ Timestamps prevent caching
- ✅ Additional questions are contextually relevant

## Example Output

### Toyota Camry Engine Noise

**Initial Questions:**

1. هل يحدث الصوت طقطقة فقط عند تشغيل المحرك، أم يستمر أثناء تشغيله؟
2. هل تزيد شدة الطقطقة عند تسخين المحرك أو بعد قيادة السيارة لمسافات طويلة؟
3. هل تشعر بأي اهتزازات غير طبيعية أثناء ظهور الطقطقة؟

**Additional Questions (after answering initial ones):**

1. هل تلاحظ أي تأثير للطقطقة على أداء المحرك أو استهلاك الوقود؟
2. هل تزداد شدة الطقطقة عند بدء تشغيل المحرك في الأيام الباردة أكثر من الأيام الحارة؟

### Dodge Charger Transmission Issue

**Initial Questions:**

1. هل تم فحص مستوى زيت ناقل الحركة وهل كانت نقاوته مناسبة؟
2. هل تم التحقق من حالة السويتشات أو الحساسات المرتبطة بناقل الحركة؟
3. هل تم فحص حالة الصمامات أو الأسلاك المتصلة بناقل الحركة للتأكد من عدم وجود تلف فيها؟

## Benefits

1. **Better Diagnosis**: Questions are tailored to specific problems
2. **No Repetition**: Each session generates unique questions
3. **Context Awareness**: Questions consider car type and problem
4. **Progressive Refinement**: Additional questions build on previous answers
5. **Kuwait-Specific**: All questions and analysis are in Arabic with Kuwait context
6. **Cache Prevention**: Unique session IDs and timestamps prevent accidental caching

## Future Enhancements

1. **Question Categories**: Categorize questions by system (engine, transmission, electrical, etc.)
2. **Difficulty Levels**: Adjust question complexity based on user expertise
3. **Multi-language Support**: Support for English questions if needed
4. **Question History**: Track which questions were most effective for different problems
5. **Machine Learning**: Use previous successful diagnoses to improve question generation
