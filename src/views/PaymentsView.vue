<template>
  <div>
    <div class="eyebrow">FINANCE / STUDENT ACCOUNT</div>
    <h1 class="page-masthead">The account ledger.</h1>
    <div class="split-page account-layout">
      <aside class="side-note">
        <small>OVERALL BALANCE · USD</small>
        <h2 class="account-balance">Not provided</h2>
        <p>{{ store.student.name }}<br />{{ store.student.studentNumber }}</p>
        <p>
          Negative entries represent payments or credit. Currency ledgers are shown separately.
        </p>
        <button class="statement-action btn btn--ghost print-button" @click="printStatement">
          Print statement ↗
        </button>
      </aside>
      <div>
        <section
          v-for="ledger in ledgers"
          :key="ledger.currency"
          class="currency-ledger section-card"
        >
          <header class="section-header-bar">
            {{ ledger.currency }} / TRANSACTION HISTORY
          </header>
          <div
            class="table-scroll"
            tabindex="0"
            role="region"
            :aria-labelledby="`ledger-${ledger.currency}`"
          >
            <table class="data-table">
              <caption :id="`ledger-${ledger.currency}`">
                {{
                  ledger.currency
                }}
                account transactions
              </caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Type</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pay in ledger.entries" :key="pay.id">
                  <td>{{ pay.date }}</td>
                  <td>{{ pay.description }}</td>
                  <td>{{ pay.type }}</td>
                  <td>{{ pay.amount.toFixed(2) }}</td>
                  <td>{{ pay.balance.toFixed(2) }}</td>
                </tr>
                <tr v-if="!ledger.entries.length">
                  <td colspan="5">No transactions recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useStudentPortalStore } from '@/stores/studentPortalStore'
const store = useStudentPortalStore()
const ledgers = computed(() => [
  { currency: 'ZiG', entries: store.zigPayments },
  { currency: 'USD', entries: store.usdPayments },
])
function printStatement() {
  window.print()
}
</script>

<style scoped>
.account-balance {
  font-size: 52px;
  margin-top: 12px;
}
.statement-action {
  margin-top: 24px;
}
.currency-ledger {
  margin-bottom: 24px;
}
</style>
