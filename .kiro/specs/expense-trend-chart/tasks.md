# Implementation Plan

## Bugfix Tasks

- [ ] 1. Read and understand the current `buildDailyTotals` method
  - Read `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/service/impl/ExpenseTrendServiceImpl.java`
  - Locate the `buildDailyTotals` method
  - Understand the current logic: initialization, projection mapping, and return
  - Identify where the cumulative sum pass needs to be inserted
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Implement cumulative sum logic in `buildDailyTotals`
  - Add cumulative sum pass after the projection mapping loop
  - Insert the following code before the `return` statement:
    ```java
    // Cumulative sum pass: carry forward running total for days with no transactions
    for (int i = 1; i < daysInMonth; i++) {
        totals[i] = totals[i - 1].add(totals[i]);
    }
    ```
  - Verify the loop starts at index 1 (day 2) and iterates through all remaining days
  - Ensure `BigDecimal.add()` is used for safe arithmetic
  - _Bug_Condition: isBugCondition(day, dailyAmountMap) where dailyAmountMap does NOT contain key for day_
  - _Expected_Behavior: For days with no transactions, totals[i] = totals[i-1] (carry forward cumulative total)_
  - _Preservation: Days with transactions still contribute their daily sum correctly before cumulative accumulation (Requirements 3.1, 3.2, 3.3, 3.4)_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Update Javadoc for `buildDailyTotals`
  - Replace the existing Javadoc comment with:
    ```java
    /**
     * Builds a cumulative daily expense array for the given month.
     * The array length equals the number of days in the month.
     * Each element at index i contains the running total of all EXPENSE
     * transactions from day 1 through day i+1 (inclusive).
     * Days with no transactions carry forward the previous day's cumulative total.
     *
     * @param user the user whose expenses to aggregate
     * @param yearMonth the month to build totals for
     * @return list of cumulative daily totals, one per day in the month
     */
    ```
  - Ensure the documentation accurately reflects the new cumulative behavior
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 4. Checkpoint — Verify implementation
  - Review the modified `ExpenseTrendServiceImpl.java` file
  - Confirm the cumulative sum loop is correctly placed
  - Confirm the Javadoc is updated
  - Confirm no other methods or files were modified
  - Ask the user if questions arise or manual testing is needed


