# Expense Trend Chart – Bugfix Design

## Overview

API `GET /api/transactions/expense-trend` trả về dữ liệu chi tiêu theo ngày dưới dạng **rời rạc** (non-cumulative). Các ngày không có giao dịch nhận giá trị `0` thay vì giữ nguyên tổng lũy kế của ngày trước, khiến đường biểu đồ bị "rơi xuống 0" không phản ánh đúng thực tế chi tiêu tích lũy.

Bugfix này chỉ sửa một phương thức duy nhất — `buildDailyTotals` trong `ExpenseTrendServiceImpl` — bằng cách thêm một vòng lặp tính tổng lũy kế (cumulative sum pass) sau khi đã map dữ liệu từ DB vào mảng. Không có thay đổi nào ở tầng repository, controller, DTO, hay frontend.

---

## Glossary

- **Bug_Condition (C)**: Điều kiện kích hoạt lỗi — một ngày trong tháng không có giao dịch EXPENSE nào, khiến `dailyAmountMap` không chứa key cho ngày đó.
- **Property (P)**: Hành vi đúng khi điều kiện lỗi xảy ra — giá trị tại ngày đó phải bằng tổng lũy kế của ngày liền trước, không phải `0`.
- **Preservation**: Các hành vi hiện tại phải giữ nguyên sau khi fix — tổng hợp đúng cho ngày có giao dịch, lọc đúng `EXPENSE + ACTIVE`, cô lập dữ liệu theo user, độ dài mảng bằng số ngày trong tháng.
- **`buildDailyTotals`**: Phương thức private trong `ExpenseTrendServiceImpl.java` chịu trách nhiệm xây dựng mảng tổng chi tiêu theo ngày cho một tháng.
- **`totals[]`**: Mảng `BigDecimal[]` có độ dài bằng số ngày trong tháng, index `i` tương ứng ngày `i+1`.
- **Cumulative sum pass**: Vòng lặp thứ hai duyệt từ index 1 đến cuối mảng, áp dụng `totals[i] = totals[i-1] + totals[i]`.

---

## Bug Details

### Bug Condition

Lỗi xảy ra khi một ngày trong tháng không có giao dịch EXPENSE nào. Phương thức `buildDailyTotals` khởi tạo mảng toàn `BigDecimal.ZERO`, map các projection từ DB vào đúng index, nhưng **không thực hiện bước tính tổng lũy kế**. Kết quả là các ngày không có giao dịch giữ nguyên giá trị `0` thay vì kế thừa tổng tích lũy từ ngày trước.

**Formal Specification:**

```
FUNCTION isBugCondition(day, dailyAmountMap)
  INPUT: day         of type int (1..lastDayOfMonth)
         dailyAmountMap of type Map<Integer, BigDecimal>
  OUTPUT: boolean

  // Bug is triggered when a day has no transaction data
  RETURN NOT dailyAmountMap.containsKey(day)
END FUNCTION
```

### Examples

| Ngày | Giao dịch | Hành vi hiện tại (lỗi) | Hành vi đúng |
|------|-----------|------------------------|--------------|
| 1    | 150.000đ  | 150.000                | 150.000      |
| 2    | (không có)| **0** ← lỗi            | 150.000      |
| 3    | (không có)| **0** ← lỗi            | 150.000      |
| 4    | 320.000đ  | 320.000                | 470.000      |
| 5    | (không có)| **0** ← lỗi            | 470.000      |
| 6    | (tương lai)| **0** ← lỗi           | 470.000      |

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Ngày có giao dịch EXPENSE phải tiếp tục được tổng hợp đúng (sum of amounts) trước khi áp dụng cumulative pass.
- Chỉ tính giao dịch có `type = EXPENSE` và `deleteFlag = ACTIVE`; các loại khác (INCOME, DEBT, DELETED) vẫn bị loại trừ.
- Dữ liệu của mỗi user phải hoàn toàn cô lập — kết quả của user A không bị ảnh hưởng bởi giao dịch của user B.
- Độ dài mảng `currentMonth` và `previousMonth` phải bằng đúng số ngày trong tháng tương ứng (28, 29, 30, hoặc 31 phần tử).
- Endpoint vẫn trả về `401 Unauthorized` khi không có JWT hợp lệ.
- Logic tháng trước (`previousMonth`) áp dụng cumulative sum độc lập, giống hệt tháng hiện tại.

**Scope:**
Tất cả các ngày **có** giao dịch không bị ảnh hưởng về giá trị daily contribution. Fix chỉ thay đổi cách các giá trị `0` được xử lý sau khi map — thay vì giữ `0`, chúng kế thừa giá trị của ngày trước.

---

## Hypothesized Root Cause

Dựa trên phân tích code trong `ExpenseTrendServiceImpl.buildDailyTotals`:

1. **Thiếu cumulative sum pass** *(root cause chính)*: Sau khi map projections vào `totals[]`, phương thức trả về mảng ngay lập tức mà không có bước tính lũy kế. Đây là nguyên nhân trực tiếp và duy nhất của bug.

   ```java
   // Hiện tại — dừng ở đây, không có cumulative pass
   for (DailyExpenseProjection projection : projections) {
       int index = projection.getDayOfMonth() - 1;
       if (index >= 0 && index < daysInMonth) {
           totals[index] = projection.getTotalAmount();
       }
   }
   return Arrays.asList(totals);  // ← trả về mảng rời rạc
   ```

2. **Không phải lỗi ở tầng repository**: Query `findDailyExpenseTotals` hoạt động đúng — nó chỉ trả về các ngày có giao dịch (GROUP BY DAY), đây là hành vi mong đợi. Việc các ngày không có giao dịch không xuất hiện trong kết quả query là bình thường.

3. **Không phải lỗi ở tầng controller hay DTO**: `TransactionController` và `ExpenseTrendResponse` không liên quan đến logic tính toán.

4. **Không phải lỗi ở frontend**: Frontend chỉ nhận và hiển thị mảng số từ API; nếu API trả về đúng, chart sẽ hiển thị đúng.

---

## Correctness Properties

Property 1: Bug Condition — Cumulative Carry-Forward

_For any_ month and any `dailyAmountMap` where `isBugCondition(day, dailyAmountMap)` is true (i.e., day has no transaction), the fixed `buildDailyTotals` function SHALL return an array where `result[day-1]` equals `result[day-2]` (the cumulative total of the previous day), not `BigDecimal.ZERO`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

Property 2: Preservation — Days With Transactions Unaffected

_For any_ month and any `dailyAmountMap` where `isBugCondition(day, dailyAmountMap)` is false (i.e., day has transactions), the fixed `buildDailyTotals` function SHALL return an array where `result[day-1]` equals `result[day-2] + dailyAmountMap.get(day)`, preserving the correct daily contribution before cumulative accumulation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

## Fix Implementation

### Changes Required

**File**: `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/service/impl/ExpenseTrendServiceImpl.java`

**Method**: `buildDailyTotals`

**Specific Changes**:

1. **Thêm cumulative sum pass** sau vòng lặp map projections, trước `return`:

   ```java
   // Cumulative sum pass: carry forward running total for days with no transactions
   for (int i = 1; i < daysInMonth; i++) {
       totals[i] = totals[i - 1].add(totals[i]);
   }
   ```

2. **Cập nhật Javadoc** của `buildDailyTotals` để phản ánh hành vi mới:

   ```java
   /**
    * Builds a cumulative daily expense array for the given month.
    * The array length equals the number of days in the month.
    * Each element at index i contains the running total of all EXPENSE
    * transactions from day 1 through day i+1 (inclusive).
    * Days with no transactions carry forward the previous day's cumulative total.
    */
   ```

**Không có thay đổi nào ở**: `TransactionRepository`, `ExpenseTrendService` (interface), `TransactionController`, `ExpenseTrendResponse`, hay bất kỳ file frontend nào.

### Algorithm — Before vs After

**Before (buggy):**
```
totals = [0, 0, 0, ..., 0]          // initialize
totals[0] = 150_000                  // day 1 has transaction
totals[3] = 320_000                  // day 4 has transaction
// no cumulative pass
return [150000, 0, 0, 320000, 0, ...]  // ← wrong
```

**After (fixed):**
```
totals = [0, 0, 0, ..., 0]          // initialize
totals[0] = 150_000                  // day 1 has transaction
totals[3] = 320_000                  // day 4 has transaction
// cumulative pass
totals[1] = totals[0] + totals[1] = 150_000 + 0 = 150_000
totals[2] = totals[1] + totals[2] = 150_000 + 0 = 150_000
totals[3] = totals[2] + totals[3] = 150_000 + 320_000 = 470_000
totals[4] = totals[3] + totals[4] = 470_000 + 0 = 470_000
...
return [150000, 150000, 150000, 470000, 470000, ...]  // ← correct
```

---

## Testing Strategy

### Validation Approach

Chiến lược kiểm thử gồm hai giai đoạn: trước tiên chạy test trên code **chưa fix** để xác nhận bug tồn tại (exploratory), sau đó chạy lại sau khi fix để xác nhận hành vi đúng (fix checking) và không có regression (preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Xác nhận bug tồn tại trên code hiện tại và làm rõ root cause trước khi implement fix.

**Test Plan**: Viết unit test mock repository trả về một tập projections thưa (sparse — chỉ một số ngày có giao dịch), gọi `buildDailyTotals`, và assert rằng các ngày không có giao dịch phải bằng tổng lũy kế của ngày trước. Chạy trên code **chưa fix** — test sẽ fail, xác nhận bug.

**Test Cases**:
1. **Sparse month test**: Tháng có giao dịch ở ngày 1 và ngày 4, các ngày còn lại không có — assert `result[1] == result[0]` (sẽ fail trên code chưa fix vì `result[1] == 0`).
2. **All-zero gap test**: Tháng chỉ có giao dịch ở ngày cuối — assert tất cả ngày trước đó bằng `0` (sẽ fail vì chúng phải bằng `0` nhưng ngày cuối phải bằng tổng tích lũy).
3. **Future days test**: Tháng hiện tại, chỉ có giao dịch ở ngày 1-5, các ngày còn lại là tương lai — assert các ngày tương lai bằng tổng tích lũy của ngày 5 (sẽ fail).
4. **Previous month test**: Tháng trước với sparse data — assert cumulative behavior (sẽ fail).

**Expected Counterexamples**:
- `result[i] == BigDecimal.ZERO` cho các ngày không có giao dịch, trong khi `result[i-1] > 0`.
- Root cause được xác nhận: thiếu cumulative sum pass trong `buildDailyTotals`.

### Fix Checking

**Goal**: Xác nhận rằng với mọi input thỏa `isBugCondition`, hàm đã fix trả về đúng giá trị lũy kế.

**Pseudocode:**
```
FOR ALL month, dailyAmountMap DO
  result := buildDailyTotals_fixed(user, month)
  FOR i FROM 1 TO lastDayOfMonth(month) DO
    IF isBugCondition(i, dailyAmountMap) THEN
      ASSERT result[i-1] = result[i-2]          // carry forward
    ELSE
      ASSERT result[i-1] = result[i-2] + dailyAmountMap[i]  // accumulate
    END IF
  END FOR
END FOR
```

### Preservation Checking

**Goal**: Xác nhận rằng với mọi input không thỏa `isBugCondition` (ngày có giao dịch), hàm đã fix cho kết quả nhất quán với hành vi đúng của hàm gốc.

**Pseudocode:**
```
FOR ALL month, dailyAmountMap WHERE dailyAmountMap.containsKey(day) FOR ALL days DO
  result_fixed := buildDailyTotals_fixed(user, month)
  // Daily contribution at each day-with-transaction must equal
  // result_fixed[day-1] - result_fixed[day-2]
  ASSERT (result_fixed[day-1] - result_fixed[day-2]) = dailyAmountMap[day]
END FOR
```

**Testing Approach**: Property-based testing được khuyến nghị vì:
- Sinh ngẫu nhiên nhiều cấu hình tháng (28/29/30/31 ngày) và tập giao dịch thưa/dày.
- Bắt được các edge case mà unit test thủ công có thể bỏ sót (tháng nhuận, tháng toàn zero, tháng chỉ có 1 giao dịch vào ngày cuối).
- Đảm bảo mạnh mẽ rằng hành vi không thay đổi cho tất cả ngày có giao dịch.

### Unit Tests

- **Sparse month**: Giao dịch ở ngày 1 và 15, assert các ngày 2-14 bằng `result[0]`, các ngày 16+ bằng `result[14]`.
- **All days have transactions**: Assert mỗi `result[i] = result[i-1] + dailyAmount[i]`.
- **Single transaction on last day**: Assert tất cả ngày trước bằng `0`, ngày cuối bằng amount.
- **February leap year (29 days)**: Assert `result.size() == 29`.
- **February non-leap year (28 days)**: Assert `result.size() == 28`.
- **Empty month (no transactions)**: Assert toàn bộ mảng là `0`.
- **Previous month cumulative**: Assert `previousMonth` cũng áp dụng cumulative logic độc lập.
- **INCOME/DELETED transactions excluded**: Mock repository không trả về chúng, assert không ảnh hưởng kết quả.

### Property-Based Tests

Sử dụng **jqwik** (đã có trong dự án Java/JUnit 5).

- **Property 1 — Cumulative carry-forward**: Với mọi `YearMonth` và mọi tập projections ngẫu nhiên, `result[i] >= result[i-1]` cho mọi `i` (tổng lũy kế không bao giờ giảm).
- **Property 2 — Daily contribution preserved**: Với mọi ngày có giao dịch, `result[i] - result[i-1]` bằng đúng `dailyAmount[i]` từ projection.
- **Property 3 — Array length invariant**: Với mọi `YearMonth`, `result.size() == yearMonth.lengthOfMonth()` (không thay đổi so với trước fix).
- **Property 4 — Monotonically non-decreasing**: Với mọi input hợp lệ (amount >= 0), mảng kết quả phải không giảm: `result[i] >= result[i-1]` cho mọi `i`.

### Integration Tests

- **Full API flow**: `GET /api/transactions/expense-trend` với user có giao dịch thưa trong tháng → assert JSON response có `currentMonth` là mảng lũy kế đúng.
- **Month boundary**: Giao dịch vào ngày cuối tháng trước và ngày đầu tháng này → assert hai mảng độc lập, không ảnh hưởng lẫn nhau.
- **No transactions**: User không có giao dịch nào → assert toàn bộ `currentMonth` và `previousMonth` là mảng `0`.
