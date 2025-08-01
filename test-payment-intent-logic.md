# Тестирование новой логики PaymentIntent

## Реализованное решение

### 1. API Endpoints
- ✅ `/api/stripe/create-payment-intent` - создание PaymentIntent
- ✅ `/api/stripe/update-payment-intent` - обновление PaymentIntent
- ✅ `/api/stripe/calculate-tax` - расчет налогов

### 2. Логика работы
1. **PaymentIntent создается только после расчета налогов**
2. **PaymentIntent автоматически обновляется при изменении налогов**
3. **PaymentIntent сбрасывается при изменении товаров в корзине**

### 3. Индикаторы состояния
- 🔵 "Calculating taxes..." - расчет налогов
- 🟠 "Updating payment amount..." - обновление PaymentIntent
- 🟢 "Payment ready" - готов к оплате
- ⚪ "Please complete your address to continue" - нужен адрес

## Сценарии для тестирования

### Сценарий 1: Базовый флоу
1. Добавить товар за $1.00 в корзину
2. Перейти на checkout
3. **Ожидаемо**: Показывается "Please complete your address to continue"
4. Заполнить адрес в California
5. **Ожидаемо**: "Calculating taxes..." → налог 7% → "Payment ready"
6. **Проверить в Stripe Dashboard**: PaymentIntent на $1.07

### Сценарий 2: Изменение адреса (основная проблема)
1. Выполнить Сценарий 1
2. **Проверить**: PaymentIntent создан на $1.07
3. Изменить штат на Delaware (без налога)
4. **Ожидаемо**: "Calculating taxes..." → "Updating payment amount..." → "Payment ready"
5. **Проверить в Stripe Dashboard**: тот же PaymentIntent обновлен до $1.00

### Сценарий 3: Изменение товаров в корзине
1. Выполнить Сценарий 1
2. **Проверить**: PaymentIntent создан на $1.07
3. Добавить еще один товар за $2.00
4. **Ожидаемо**: PaymentIntent сбрасывается, создается новый на $3.21 (с налогом)

### Сценарий 4: Международный адрес
1. Добавить товар за $1.00
2. Заполнить адрес в Canada
3. **Ожидаемо**: налог 0%, PaymentIntent на $1.00

### Сценарий 5: Быстрое изменение адреса
1. Добавить товар за $1.00
2. Быстро менять штаты: CA → NY → TX → FL
3. **Ожидаемо**: система должна корректно обрабатывать debounce и не создавать лишние запросы

## Команды для тестирования

### Проверка в браузере
```bash
# Открыть DevTools → Console
# Искать логи:
# - "Creating PaymentIntent:"
# - "PaymentIntent created successfully:"
# - "Updating PaymentIntent due to tax change:"
# - "PaymentIntent updated successfully:"
```

### Проверка в Stripe Dashboard
```bash
# 1. Войти в https://dashboard.stripe.com/
# 2. Перейти в Payments
# 3. Найти PaymentIntent по времени создания
# 4. Проверить Amount и Metadata
```

### Проверка в базе данных
```sql
-- Проверить заказы с правильными суммами
SELECT 
  id,
  total_amount,
  tax_amount,
  payment_intent_id,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

## Ожидаемые результаты

### ✅ Что должно работать
1. PaymentIntent создается только после расчета налогов
2. Сумма в Stripe = сумма на экране = сумма в базе данных
3. При изменении адреса PaymentIntent обновляется автоматически
4. Индикаторы состояния показывают правильный статус
5. Нет лишних запросов к Stripe API

### ❌ Что НЕ должно происходить
1. PaymentIntent не создается до расчета налогов
2. Нет расхождений между отображаемой и списываемой суммой
3. Нет дублирования PaymentIntent при быстрых изменениях
4. Нет ошибок при изменении адреса

## Логи для отладки

### Успешное создание PaymentIntent
```
PaymentIntent creation conditions met: {
  cartLoading: false,
  itemsLength: 1,
  hasClientSecret: false,
  isCalculating: false,
  hasCompleteAddress: true,
  country: "US",
  hasState: true,
  taxAmount: 0.07
}

Creating PaymentIntent: {
  subtotal: 1,
  taxAmount: 0.07,
  totalWithTax: 1.07,
  amountInCents: 107,
  itemCount: 1
}

PaymentIntent created successfully: {
  paymentIntentId: "pi_...",
  amount: 107,
  taxAmount: 7
}
```

### Успешное обновление PaymentIntent
```
Updating PaymentIntent due to tax change: {
  paymentIntentId: "pi_...",
  oldAmount: 107,
  newAmount: 100,
  taxAmount: 0
}

PaymentIntent updated successfully: {
  paymentIntentId: "pi_...",
  newAmount: 100,
  taxAmount: 0
}
```

## Критерии успеха

1. ✅ **Точность сумм**: Stripe Dashboard показывает правильную сумму
2. ✅ **Автоматическое обновление**: PaymentIntent обновляется при изменении адреса
3. ✅ **Пользовательский опыт**: Индикаторы состояния работают корректно
4. ✅ **Производительность**: Нет лишних запросов к API
5. ✅ **Надежность**: Обработка edge cases работает правильно

## Следующие шаги после тестирования

1. Если тесты проходят успешно → решение готово к продакшену
2. Если есть проблемы → исправить и повторить тестирование
3. Добавить мониторинг для отслеживания работы в продакшене