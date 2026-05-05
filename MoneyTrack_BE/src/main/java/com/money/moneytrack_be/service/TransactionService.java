package com.money.moneytrack_be.service;

import com.money.moneytrack_be.entity.Transaction;
import com.money.moneytrack_be.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionService {

    Transaction create(String userEmail, BigDecimal amount, TransactionType type,
                       Long categoryId, String description, LocalDate date);

    Page<Transaction> getTransactions(String userEmail, String month,
                                      Long categoryId, Pageable pageable);

    Transaction update(String userEmail, Long transactionId, BigDecimal amount,
                       TransactionType type, Long categoryId, String description, LocalDate date);

    void delete(String userEmail, Long transactionId);

    List<Transaction> getTransactionsForExport(String userEmail, String month, Long categoryId);

    byte[] buildCsvBytesPublic(List<Transaction> transactions);

    String buildExportFilename(String month, Long categoryId, List<Transaction> transactions);
}
