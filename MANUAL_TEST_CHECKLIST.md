# 🚗 Car AI Manual Test Checklist

## ✅ **Backend Status: WORKING**

- ✅ Server running on port 8001
- ✅ Health check endpoint working
- ✅ AI diagnosis endpoints working
- ✅ Validation error handling working
- ✅ CarQuery API integration working
- ✅ Year validation working

## 📱 **Frontend Status: WORKING**

- ✅ Expo server running on port 8081
- ✅ QR code available for testing
- ✅ Can connect to backend

---

## 🔧 **Manual Testing Steps**

### **1. Frontend App Testing (Using Expo Go)**

#### **A. Form Validation**

- [ ] **Brand/Model Input:**

  - [ ] Type "Toyota Camry" - should auto-detect brand and model
  - [ ] Type "دودج تشارجر" - should work with Arabic input
  - [ ] Type "Dodge Charger" - should work with English input
  - [ ] Try invalid combinations - should show validation errors

- [ ] **Year Validation:**

  - [ ] Enter year 2020 for Camry - should be valid
  - [ ] Enter year 1900 for Camry - should show error (Camry started 1982)
  - [ ] Enter year 2030 for Camry - should be valid (future year allowed)

- [ ] **Mileage Validation:**
  - [ ] Enter 0 - should show "New Car" message
  - [ ] Enter 50000 - should be valid
  - [ ] Enter negative number - should show error

#### **B. AI Diagnosis Flow**

- [ ] **Complete Form Submission:**

  - [ ] Fill all required fields
  - [ ] Submit form
  - [ ] Should show loading state
  - [ ] Should receive AI diagnosis response
  - [ ] Should show follow-up questions

- [ ] **Error Handling:**
  - [ ] Submit empty form - should show validation errors
  - [ ] Submit with invalid data - should show appropriate errors

#### **C. Real-time Feedback**

- [ ] **Validation Banners:**
  - [ ] Green banner for valid inputs
  - [ ] Yellow banner for warnings
  - [ ] Red banner for errors
  - [ ] Real-time updates as you type

### **2. Backend API Testing (Using Postman/curl)**

#### **A. Health Check**

```bash
curl http://localhost:8001/health
```

Expected: `{"status":"OK","message":"Car AI Backend is running"}`

#### **B. AI Diagnosis**

```bash
curl -X POST http://localhost:8001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "carType": "Toyota",
    "carModel": "Camry",
    "year": "2020",
    "mileage": "50000",
    "problemDescription": "Engine makes strange noise when starting"
  }'
```

Expected: Success response with AI diagnosis and follow-up questions

#### **C. CarQuery API**

```bash
curl "http://localhost:8001/api/car-query/year-range?make=toyota&model=camry"
```

Expected: Year range data for Toyota Camry

#### **D. Year Validation**

```bash
curl -X POST http://localhost:8001/api/car-query/validate-year \
  -H "Content-Type: application/json" \
  -d '{
    "make": "toyota",
    "model": "camry",
    "year": "2020"
  }'
```

Expected: Validation result with isValid: true

### **3. Special Cases Testing**

#### **A. Dodge Models (Arabic/English)**

- [ ] Test "دودج تشارجر" (Arabic)
- [ ] Test "Dodge Charger" (English)
- [ ] Test "دودج تشالنجر" (Arabic)
- [ ] Test "Dodge Challenger" (English)

#### **B. Edge Cases**

- [ ] Very long problem descriptions
- [ ] Special characters in inputs
- [ ] Network connectivity issues
- [ ] Backend server restart

---

## 🎯 **Success Criteria**

### **✅ All Tests Pass When:**

1. **Frontend:**

   - Form validation works correctly
   - Real-time feedback is responsive
   - AI diagnosis returns meaningful results
   - Error handling is user-friendly
   - Arabic/English input works seamlessly

2. **Backend:**

   - All API endpoints respond correctly
   - Validation errors return 400 status
   - AI diagnosis provides Kuwait-specific advice
   - CarQuery integration works reliably
   - Error handling is robust

3. **Integration:**
   - Frontend can communicate with backend
   - Data flows correctly between components
   - Error states are handled gracefully

---

## 🚨 **If Tests Fail:**

### **Common Issues & Solutions:**

1. **Backend not starting:**

   - Check if port 8001 is free: `netstat -ano | findstr :8001`
   - Kill process if needed: `taskkill /PID [PID] /F`

2. **Frontend not connecting:**

   - Verify backend is running
   - Check network connectivity
   - Ensure correct API base URL

3. **AI diagnosis failing:**

   - Check OpenAI API key in .env file
   - Verify internet connectivity
   - Check API quota/limits

4. **Validation not working:**
   - Check browser console for errors
   - Verify form field names match backend expectations
   - Test with different input combinations

---

## 📊 **Test Results Summary**

**Expected Results:**

- ✅ Backend APIs: 10/10 working
- ✅ Frontend App: All features functional
- ✅ Integration: Seamless communication
- ✅ Error Handling: Robust and user-friendly

**Current Status:** 🟢 **WORKING** - Core functionality is operational!

---

_Last Updated: 2025-07-06_
_Tested by: Car AI Development Team_
