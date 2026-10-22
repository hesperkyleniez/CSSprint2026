# Pili BatchPilot

**Pili BatchPilot is a batch-planning and decision-support prototype for pili processors and cooperatives in Sorsogon.** It helps a processor compare incoming offers, plan a feasible mix against available processing capacity and buyer demand, and understand how changes in prices or yield assumptions affect the decision.

> **Prototype notice:** Any sample offers, prices, yields, costs, orders, and capacities included in the demo are simulated unless explicitly identified as sourced data. The system does not claim to use verified Sorsogon operating data or to guarantee profit.

## The problem

Pili moves through several product forms and stakeholders before becoming a consumer product. A processor may need to evaluate a supplier’s offer, understand the likely output and processing costs, and decide whether it fits the capacity and demand available to that business. Those choices are harder when records are incomplete or farmers, traders, and processors are not well connected.

A 2025 study of the Sorsogon pili value chain reports that supply exceeds the daily quantity required by Bicol-based processors and associates underutilization and post-harvest losses with limited storage and market linkages. A 2023 UPLB thesis describes multiple routes for fresh pili, shelled pili, kernels, and processed products; it also reports weak direct connections between farmers and processors, with traders often acting as middlemen. These findings motivate the project, but do not validate BatchPilot’s calculations or prove that the app alone can solve the wider storage and market-access problems.

**Problem statement:** Small pili processors and cooperatives need a clearer way to compare incoming pili offers and plan processing against their own expected yields, costs, available capacity, and buyer demand. Without those comparisons, they may have difficulty deciding which offers to accept or negotiate and how to allocate processing work.

## Project overview

BatchPilot turns each incoming **offer** into a transparent planning scenario. It uses processor-entered values—or that processor’s own past records, when available—to estimate a range of saleable output and contribution. It then selects a feasible mix of offers against the processor’s entered capacity and buyer orders, calculates a walk-away purchase price, and lets the user explore price changes.

BatchPilot is a decision aid, not an automatic buyer, quality grader, marketplace, or profit predictor. The processor reviews the assumptions and makes the final decision.

### Who it is for

- **Primary users:** small pili processors and pili-processing cooperatives in Sorsogon.
- **Other possible suppliers:** farmers, traders, or cooperatives offering pili to a processor.
- **Not the primary user:** a retail shop selling packaged pili snacks. That business has different inventory and sales decisions.

Each record identifies the pili form, such as fresh fruit, shelled pili, or kernels. These forms must not share an assumed yield rate.

## End-to-end system flow

1. **Set up the planning scenario.** The processor enters buyer orders, requested product form and quantity, selling price, delivery deadline, available capacity for relevant steps, and any limits on how much material to buy or hold.
2. **Record offers.** Staff enter supplier type, pili form, source, reported harvest date (if known), offered quantity, quoted price, and a manually assessed grade or notes. The app does not independently verify these details.
3. **Set yield and cost assumptions.** For each offer, the processor supplies a low, typical, and high output estimate and the relevant processing costs. If comparable completed batches exist, BatchPilot can summarize those records. A new user starts with manual assumptions; the interface labels them as such.
4. **Show estimate quality.** Each yield and contribution range shows its basis—for example, “manual estimate” or “based on 4 comparable completed batches”—and a data-coverage label. With little or no history, it reports low data coverage instead of implying a reliable prediction.
5. **Optimize the offer mix.** The planner selects a feasible combination of offers to meet buyer orders and maximize estimated contribution, subject to entered purchasing and processing-capacity constraints. It shows selected and unselected offers, the constraints that affected the plan, and the assumptions behind its recommendation. The processor can override the result.
6. **Calculate a counteroffer.** For an offer that misses the processor’s target, BatchPilot shows the maximum purchase price that would meet the target under the selected assumptions. The processor may use this as a negotiation reference, accept, counter, hold, or decline.
7. **Explore “what if” scenarios.** The user changes a buying price, selling price, yield assumption, order quantity, or capacity value. The offer mix, estimated contribution range, and counteroffer price update immediately. A scenario is an estimate, not a prediction of actual sales or profit.
8. **Track accepted material and record actual results.** Once accepted, an offer becomes a delivery and can be assigned to a processing batch. Staff record the actual output and costs when processing is complete. Those results can inform estimates for future comparable batches.

## Core calculations and upgrades

### 1. Yield range and estimate quality

BatchPilot represents output as a **low / typical / high range**, rather than a single certain number. The range can come from user-entered assumptions or from the processor’s own comparable completed batches. The app shows the number of records and the source of each estimate. It does not treat a published fruit-composition figure as a verified saleable-kernel yield.

The contribution range is calculated transparently for the displayed scenarios:

```text
Estimated sales = estimated saleable output × entered selling price
Estimated contribution = estimated sales − raw-material cost − entered processing costs
```

“Contribution” includes only the costs entered in the scenario; it is not necessarily net profit. With no user history, the prototype uses manual or simulated assumptions and clearly labels them.

### 2. Capacity-constrained offer optimizer

The planner considers the **mix** of offers, not just a one-by-one ranking. It uses processor-entered constraints such as available raw-material capacity, drying capacity, or cracking labor hours, as well as buyer-order quantities. The demo objective is to maximize estimated contribution while respecting those constraints and avoiding planned output beyond entered demand.

The optimizer’s recommendation is only as reliable as its inputs. It does not create new buyers, storage, or processing capacity, and it does not claim that an unconfirmed buyer order is real demand.

### 3. Counteroffer calculator

The processor sets a target contribution or margin. For a target contribution amount, the walk-away price per kilogram is:

```text
Maximum purchase price/kg =
  (estimated sales − processing costs − target contribution) ÷ offered kilograms
```

The interface can show the implied contribution at the current offer and at a suggested counteroffer. The result changes with the yield range, selling price, and cost assumptions.

### 4. Price-sensitivity “what if”

Editable prices and assumptions update the plan live. For example, a user can raise a supplier’s quoted price or lower the expected selling price and see whether the selected mix or counteroffer changes. This supports scenario comparison; it is not a forecast that the processor can sell at the entered price.

## Scope

### Included in the prototype

- Offer, delivery, and processing-batch records with pili form and supplier type.
- User-entered capacity, buyer-order, yield-range, price, and cost assumptions.
- Estimate-quality labels showing data source and comparable-record count.
- A small capacity-constrained offer-mix planner.
- Walk-away price and counteroffer calculations.
- Live price and assumption sensitivity scenarios.
- Actual-versus-estimated batch closeout to build processor-specific records.
- Simulated demonstration records, clearly marked as simulated.

### Out of scope

- A live buyer-seller marketplace or verified buyer orders.
- Verified current Sorsogon purchase or selling prices.
- A universal pili yield, processing-cost, capacity, or shelf-life model.
- Automated visual grading, freshness or spoilage prediction, or food-safety certification.
- Supplier trust scores or reliability rankings.
- Product-mix recommendations across kernels, roasted pili, candy, or other recipes.
- Claims of reduced losses, increased income, or improved profit based only on simulated data.

## Limitations and assumptions

- Published sources establish relevant value-chain context, but do not provide enough processor-specific input data to calibrate BatchPilot’s yield, cost, freshness, or capacity estimates.
- The 2025 Sorsogon value-chain study is based on purposive interviews with 15 key informants. Its reported regional findings should not be treated as a measurement of every processor’s business.
- At cold start, estimates come from manual or simulated inputs. Historical estimates become more useful only after the processor records comparable batches; they are summaries of that business’s data, not a universal pili model.
- “Comparable” depends on material form, grade, and processing route. Combining unlike batches can make averages misleading.
- The optimizer can only account for constraints and demand entered by the user. It does not fix physical storage shortages or limited market access.
- Walk-away prices and contribution ranges are scenario calculations. Missing costs, unsold output, or inaccurate inputs can change the result.
- Supplier, harvest-date, grade, and quantity information is user-entered unless a future verified integration is added.

## References

1. Dio, J. R. V., Dio, R. V., & Lacson, D. C. F. (2025). [“From Fruit to Nut: Revisiting Pili Nut Production Capacities and Value-Adding Activities in Sorsogon, Philippines.” *The Philippine Agricultural Scientist*, 108(4)](https://www.ukdr.uplb.edu.ph/pas/vol108/iss4/7/). Reports a value-chain analysis based on interviews with 15 key informants and identifies supply-capacity, storage, and market-linkage constraints.
2. Latoza, S. B. P. (2023). [*Value Chain Analysis of Pili Nuts (Canarium ovatum) in Sorsogon, Philippines*](https://www.ukdr.uplb.edu.ph/etd-undergrad/11754/). UPLB undergraduate thesis. Describes stakeholder relationships, product forms and routes, informal transactions, and issues including price fluctuation and marketing. The repository notes that full-text access is restricted to UP Gmail accounts.
3. Torres, E. E. (2025). [*Environmental and Economic Analysis of Post-Harvest Technological Progress of Pili Processing in the Bicol Region, Philippines*](https://www.ukdr.uplb.edu.ph/etd-grad/4072/). UPLB PhD dissertation record. Its abstract describes a study including 110 processors and 120 farmers and discusses processing stages, resource use, and machinery economics. The repository indicates the full document is not available there.
4. Department of Agriculture Regional Field Office V. (2023). [“Exploring the Potential of Bicol’s Pili Nut as an Export Product.”](https://bicol.da.gov.ph/exploring-the-potential-of-bicols-pili-nut-as-an-export-product/) Provides regional pili context and product-composition information. Composition figures are not used by BatchPilot as processor-specific yield predictions.
