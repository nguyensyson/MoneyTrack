# Bugfix Requirements Document

## Introduction

API `GET /api/transactions/expense-trend` hiện tại trả về tổng chi tiêu theo từng ngày dưới dạng giá trị rời rạc (non-cumulative). Điều này gây ra hai lỗi hiển thị trên biểu đồ:

1. **Không lũy kế**: Các ngày không có giao dịch trả về `0` thay vì giữ nguyên tổng lũy kế của ngày trước đó, khiến đường biểu đồ bị "rơi xuống 0" không phản ánh đúng thực tế chi tiêu tích lũy.
2. **Ngày tương lai reset về 0**: Các ngày trong tháng chưa đến (future days) cũng trả về `0`, trong khi đúng ra phải giữ nguyên tổng lũy kế tại thời điểm hiện tại.

Bugfix này sửa logic tổng hợp dữ liệu trong `ExpenseTrendServiceImpl` để áp dụng tính tổng lũy kế (cumulative sum) xuyên suốt từ ngày 1 đến ngày cuối tháng.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a day in the month has no EXPENSE transactions THEN the system returns `0` for that day's position in the array instead of carrying forward the previous day's running total

1.2 WHEN iterating over days in the current month and a future day (after today) has no transactions THEN the system returns `0` for that day's position, causing the chart line to drop to zero

1.3 WHEN multiple consecutive days have no transactions THEN the system returns `0` for each of those days, producing a flat-zero segment on the chart instead of a flat line at the last known cumulative total

### Expected Behavior (Correct)

2.1 WHEN a day in the month has no EXPENSE transactions THEN the system SHALL carry forward the previous day's cumulative total for that day's position in the array (i.e., the running total does not decrease)

2.2 WHEN iterating over days in the current month and a future day has no transactions THEN the system SHALL use the cumulative total reached up to the last day with data (the chart line SHALL remain flat, not drop to zero)

2.3 WHEN a future day has a transaction (future-dated data) THEN the system SHALL include that transaction's amount in the cumulative sum for that day and all subsequent days

2.4 WHEN computing the cumulative array, the system SHALL iterate from day 1 to the last day of the month, applying the formula: `cumulative[i] = cumulative[i-1] + dailyAmount[i]` where `dailyAmount[i]` is `0` if no transaction exists for that day

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a day has one or more EXPENSE transactions THEN the system SHALL CONTINUE TO include the exact sum of those transactions' amounts in the daily contribution before applying the cumulative sum

3.2 WHEN computing expense totals, the system SHALL CONTINUE TO exclude transactions where `type != EXPENSE` or `deleteFlag != ACTIVE`

3.3 WHEN computing expense totals, the system SHALL CONTINUE TO only include transactions belonging to the authenticated user making the request

3.4 WHEN returning the response, the system SHALL CONTINUE TO return `currentMonth` and `previousMonth` arrays whose lengths equal the number of days in their respective calendar months (28, 29, 30, or 31 elements)

3.5 WHEN a request is made without a valid JWT token, the system SHALL CONTINUE TO return HTTP 401 Unauthorized

3.6 WHEN the previous month is computed, the system SHALL CONTINUE TO apply the same cumulative logic independently for that month's data

---

## Bug Condition

### Bug Condition Function

```pascal
FUNCTION isBugCondition(day, dailyAmountMap)
  INPUT: day of type int (1..lastDayOfMonth),
         dailyAmountMap of type Map<Int, BigDecimal>
  OUTPUT: boolean

  // Bug is triggered when a day has no transaction data
  RETURN NOT dailyAmountMap.containsKey(day)
END FUNCTION
```

### Property: Fix Checking

```pascal
// Property: Fix Checking — Cumulative Sum Preservation
FOR ALL month, dailyAmountMap DO
  result ← buildCumulativeArray'(month, dailyAmountMap)
  FOR i FROM 1 TO lastDayOfMonth(month) DO
    IF isBugCondition(i, dailyAmountMap) THEN
      ASSERT result[i-1] = result[i-2]   // carry forward, not 0
    ELSE
      ASSERT result[i-1] = result[i-2] + dailyAmountMap[i]
    END IF
  END FOR
END FOR
```

### Property: Preservation Checking

```pascal
// Property: Preservation Checking
FOR ALL month, dailyAmountMap WHERE NOT isBugCondition(day, dailyAmountMap) FOR ALL days DO
  // Days that DO have transactions must still aggregate correctly
  ASSERT F(month, dailyAmountMap) = F'(month, dailyAmountMap)
    WITH RESPECT TO days that have transactions
END FOR
```
