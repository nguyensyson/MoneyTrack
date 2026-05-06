# Bugfix Requirements Document

## Introduction

Popup chỉnh sửa giao dịch (`TransactionModal`) không hiển thị danh mục theo dạng cha-con (hierarchical), trong khi trang tạo giao dịch (`/transactions/create`) đã hiển thị đúng. Hệ quả là khi người dùng mở popup edit một giao dịch có danh mục con, ô chọn danh mục hiển thị trống — không nhận diện được `categoryId` của danh mục con vì danh sách phẳng (flat list) không chứa các danh mục con được lồng bên trong danh mục cha.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN người dùng mở popup edit một giao dịch có `categoryId` là danh mục con (subcategory) THEN hệ thống hiển thị ô danh mục trống (không có giá trị được chọn)

1.2 WHEN `TransactionModal` nhận vào danh sách `categories: ApiCategory[]` và render dropdown THEN hệ thống chỉ hiển thị danh sách phẳng (flat list) các danh mục cha, bỏ qua toàn bộ danh mục con nằm trong `children`

1.3 WHEN người dùng mở dropdown danh mục trong popup edit THEN hệ thống không phân biệt cấp cha-con, hiển thị tất cả danh mục cùng một cấp thụt lề và kiểu chữ

### Expected Behavior (Correct)

2.1 WHEN người dùng mở popup edit một giao dịch có `categoryId` là danh mục con THEN hệ thống SHALL hiển thị đúng tên danh mục con đó trong ô chọn danh mục

2.2 WHEN `TransactionModal` render dropdown danh mục THEN hệ thống SHALL hiển thị danh mục theo dạng cha-con (hierarchical), tương tự `CategorySelector` đang dùng ở trang tạo giao dịch

2.3 WHEN người dùng mở dropdown danh mục trong popup edit THEN hệ thống SHALL hiển thị danh mục cha in đậm và danh mục con thụt lề vào trong, cho phép chọn cả danh mục cha lẫn danh mục con

### Unchanged Behavior (Regression Prevention)

3.1 WHEN người dùng mở popup edit một giao dịch có `categoryId` là danh mục cha THEN hệ thống SHALL CONTINUE TO hiển thị đúng tên danh mục cha đó trong ô chọn danh mục

3.2 WHEN người dùng thay đổi loại giao dịch (INCOME/EXPENSE) trong popup edit THEN hệ thống SHALL CONTINUE TO lọc và chỉ hiển thị các danh mục thuộc loại tương ứng, đồng thời reset `categoryId` về rỗng

3.3 WHEN người dùng submit form chỉnh sửa giao dịch sau khi chọn danh mục THEN hệ thống SHALL CONTINUE TO gửi đúng `categoryId` (dạng số) lên API

3.4 WHEN người dùng mở popup tạo giao dịch mới (không phải edit) THEN hệ thống SHALL CONTINUE TO hiển thị dropdown danh mục trống chờ người dùng chọn

3.5 WHEN trang tạo giao dịch (`/transactions/create`) render `CategorySelector` THEN hệ thống SHALL CONTINUE TO hoạt động đúng như hiện tại, không bị ảnh hưởng bởi thay đổi trong `TransactionModal`

---

## Bug Condition (Pseudocode)

**Bug Condition Function** — xác định input kích hoạt bug:

```pascal
FUNCTION isBugCondition(transaction, categories)
  INPUT: transaction of type ApiTransaction, categories of type ApiCategory[]
  OUTPUT: boolean

  // Bug xảy ra khi giao dịch có categoryId là danh mục con
  // (tức là categoryId không tồn tại ở cấp top-level của danh sách categories,
  //  mà chỉ tồn tại bên trong children của một danh mục cha)
  topLevelIds ← { c.id | c in categories }
  RETURN transaction.categoryId NOT IN topLevelIds
END FUNCTION
```

**Property: Fix Checking**

```pascal
FOR ALL (transaction, categories) WHERE isBugCondition(transaction, categories) DO
  rendered ← renderTransactionModal(transaction, categories)
  ASSERT rendered.categorySelectValue = String(transaction.categoryId)
  ASSERT rendered.categoryDisplayText ≠ placeholder
END FOR
```

**Property: Preservation Checking**

```pascal
FOR ALL (transaction, categories) WHERE NOT isBugCondition(transaction, categories) DO
  ASSERT renderTransactionModal_fixed(transaction, categories)
       = renderTransactionModal_original(transaction, categories)
END FOR
```
