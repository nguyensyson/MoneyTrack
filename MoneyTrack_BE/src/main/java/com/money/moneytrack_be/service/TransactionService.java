package com.money.moneytrack_be.service;

import com.money.moneytrack_be.entity.TransactionItem;
import com.money.moneytrack_be.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionService {

    TransactionItem create(String userEmail, BigDecimal amount, TransactionType type,
                           String categoryId, String description, LocalDate date);

    Page<TransactionItem> getTransactions(String userEmail, Integer month, Integer year,
                                          String categoryId, Pageable pageable);

    TransactionItem update(String userEmail, String transactionId, BigDecimal amount,
                           TransactionType type, String categoryId, String description, LocalDate date);

    void delete(String userEmail, String transactionId);

    List<TransactionItem> getTransactionsForExport(String userEmail, String month, String categoryId);

    byte[] buildCsvBytesPublic(List<TransactionItem> transactions);

    String buildExportFilename(String month, String categoryId, List<TransactionItem> transactions);
}
