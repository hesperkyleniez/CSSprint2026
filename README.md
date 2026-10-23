# Talli

**Talli is a buying-decision simulator for pili processors and cooperatives in Sorsogon.** In a focused two-day demo, a processor enters one buyer order, three supplier offers, one capacity bottleneck, and uncertain yields. BatchPilot reveals the best typical-yield plan, checks whether a more conservative plan can still meet the target under low yield, and shows why each plan wins or fails.

> **Prototype notice:** Any sample offers, prices, yields, costs, orders, and capacities included in the demo are simulated unless explicitly identified as sourced data. The system does not claim to use verified Sorsogon operating data or to guarantee profit.

## The problem

Pili moves through several product forms and stakeholders before becoming a consumer product. For a processor facing multiple supplier offers, a buyer order, and limited capacity at a processing step such as drying, the buying decision is not simply which offer has the lowest price. The processor must consider the quantity and form offered, expected saleable output, processing costs, order requirements, and the possibility that actual yield will be lower than expected.

A 2025 study of the Sorsogon pili value chain reports that supply exceeds the daily quantity required by Bicol-based processors and associates underutilization and post-harvest losses with limited storage and market linkages. A 2023 UPLB thesis describes multiple routes for fresh pili, shelled pili, kernels, and processed products; it also reports weak direct connections between farmers and processors, with traders often acting as middlemen. These findings motivate the project, but do not validate BatchPilot’s calculations or prove that the app alone can solve the wider storage and market-access problems.

**Problem statement:** When several pili offers compete for limited processing capacity and a buyer order, small processors and cooperatives need a way to compare feasible buying plans under uncertain yield and price assumptions. Without that comparison, they may not see which combination fits the order, what each plan could earn under low, typical, or high yield, or how much they can afford to pay.

## Project overview

BatchPilot is designed around one buying decision at a time. The user selects one pili input form and output route, then enters one buyer order, three offers of that same input form, the available capacity for a bottleneck such as drying, and low, typical, and high conversion assumptions. The server-side optimizer compares all feasible offer combinations, displays output and contribution ranges with limiting constraints, calculates a walk-away price, and updates the recommendation when an assumption changes.

The central question is: **“Given these offers and my capacity, which combination should I accept, and what is the highest price I can afford to pay?”** BatchPilot explains its recommendation; the processor makes the final decision. The prototype is a session-based simulator, not a records-management app: it does not require an account or save scenario data after the session.

### Who it is for

- **Primary users:** small pili processors and pili-processing cooperatives in Sorsogon.
- **Other possible suppliers:** farmers, traders, or cooperatives offering pili to a processor.
- **Not the primary user:** a retail shop selling packaged pili snacks. That business has different inventory and sales decisions.

The conversion assumption is specific to the selected input form and processing route—for example, fresh fruit with pulp → dried nut in shell → kernel; dried nut in shell → kernel; or kernel → packed kernel product. These routes do not share a yield rate. The demo compares offers with the same selected input form and route so their estimates are comparable. Any conversion ranges are user-entered or simulated, not published local constants.

## End-to-end system flow

1. **Enter one buyer order.** Set the requested product form, quantity, selling price, deadline, and whether the order is **confirmed** or **estimated**. Demo orders are labeled simulated.
2. **Enter three supplier offers.** For each offer, enter supplier type, quantity, quoted price, and optional source or grade notes. All three offers use the selected intake form and processing route so their yields and capacity use can be compared consistently. In this small demo, each offer is accepted or declined as a whole; partial-quantity negotiation is out of scope. The simulator treats offers as scenario inputs, not verified transactions.
3. **Set capacity, costs, and target.** Enter the available capacity for the constrained step in the scenario (for example, the maximum raw-input kilograms that can be dried during the planning period), relevant processing costs, and the minimum contribution the processor wants to meet. Capacity and target are editable scenario values, not claimed Sorsogon industry benchmarks.
4. **Set form-specific conversion uncertainty.** Enter low, typical, and high output per unit of input for the selected form and processing route. For example, fresh pili fruit with pulp and dried nuts in shell require different conversion assumptions when the buyer order is for kernels. At cold start, these values are manually supplied or simulated; the app labels them and does not claim they are locally calibrated.
5. **Run the server-side optimizer.** The browser sends the scenario to a Next.js API route. The route validates the inputs, evaluates all combinations of the three offers (at most seven non-empty combinations), and returns plans that satisfy the order and capacity constraints.
6. **Reveal two plans.** **Plan A** is the feasible plan with the highest typical-yield contribution. **Plan B** is a plan that meets the processor’s target under low-yield assumptions, if one exists. If none does, the app says so instead of inventing a safe plan.
7. **Show why.** The result screen shows selected offers, capacity used and remaining, low/typical/high output and contribution, order coverage, any output beyond the entered order, walk-away prices, and which constraint ruled out alternatives. Revenue is counted only for output matched to the entered order; extra output is shown as unmatched, not assumed sold. For example: “Plan A earns more in the typical case, but misses your target at low yield. Plan B meets the target in the low-yield case and uses 80% of drying capacity.” The wording is illustrative; demo figures are simulated.
8. **Trigger the live decision change.** Move one price or capacity control. The browser resubmits the scenario; the server recalculates the plans, contribution ranges, counteroffer, and explanation. The key demo moment is seeing the recommendation switch and being able to see exactly why.
9. **End the session.** The user can explore another scenario, but the prototype does not save offers, orders, or results after the session.

## Core calculations and upgrades

### 1. Yield range and estimate quality

BatchPilot represents output as a **low / typical / high range**, rather than a single certain number. In this prototype, the user enters the range or uses clearly labeled simulated values. The app identifies the range as manual or simulated and shows its effect on the buying plan. It does not treat a published fruit-composition figure as a verified saleable-kernel yield. Learning from comparable past batches is future scope, after real records are available.

The contribution range is calculated transparently for the displayed scenarios:

```text
Estimated output = accepted input quantity × form-and-route-specific conversion assumption
Order-backed sales = min(estimated saleable output, entered order quantity) × entered selling price
Estimated contribution = order-backed sales − raw-material cost − entered processing costs
```

“Contribution” includes only the costs entered in the scenario; it is not necessarily net profit. The low, typical, and high scenarios are not statistically calibrated confidence intervals. They are transparent what-if assumptions for comparing plans.

### 2. Capacity-constrained offer optimizer

The planner considers the **mix** of offers, not just a one-by-one ranking. With three all-or-nothing offers, a server-side route can enumerate every possible combination without a complex optimization service. **Plan A** is the capacity-feasible mix with the highest typical contribution. **Plan B** is a mix that meets the processor’s target under low-yield assumptions, if one exists. The entered order caps the revenue counted in the scenario; any extra output is surfaced as unmatched. The demo makes the tradeoff between typical return and downside visible.

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

- One session-based buying scenario with one buyer order, three supplier offers, and a capacity constraint.
- One selected intake form and processing route per scenario; unlike forms are not compared using a shared yield assumption.
- User-entered low, typical, and high yield assumptions, prices, and costs.
- Clear labels distinguishing confirmed versus estimated orders and manual versus simulated inputs.
- A capacity-constrained offer-mix planner with typical and conservative low-yield plans.
- A server-side optimization API that validates scenario inputs and returns plans and explanations.
- Order coverage and unmatched output, with sales counted only up to the entered order quantity.
- Walk-away price and counteroffer calculations under the displayed yield scenarios.
- A results view explaining selected offers, capacity use, contribution range, and binding constraints.
- Live price and assumption sensitivity, with the recommendation and explanation updating immediately.
- Simulated demonstration inputs, clearly marked as simulated.

### Out of scope

- A live buyer-seller marketplace or verified buyer orders.
- Verified current Sorsogon purchase or selling prices.
- Accounts, databases, persistent records, dashboards, or learning from historical batch records.
- A universal pili yield, processing-cost, capacity, or shelf-life model.
- Automated visual grading, freshness or spoilage prediction, or food-safety certification.
- Supplier trust scores or reliability rankings.
- Product-mix recommendations across kernels, roasted pili, candy, or other recipes.
- Claims of reduced losses, increased income, or improved profit based only on simulated data.

## Limitations and assumptions

- Published sources establish relevant value-chain context, but do not provide enough processor-specific input data to calibrate BatchPilot’s yield, cost, or capacity estimates.
- The 2025 Sorsogon value-chain study is based on purposive interviews with 15 key informants. Its reported regional findings should not be treated as a measurement of every processor’s business.
- At cold start, yield ranges and costs are manual or simulated assumptions. They are not estimates learned from local processors’ historical records.
- The low, typical, and high scenarios are not calibrated probabilities or confidence intervals. They make uncertainty visible for scenario comparison.
- The optimizer can only account for constraints and demand entered by the user. It does not fix physical storage shortages or limited market access.
- Walk-away prices and contribution ranges are scenario calculations. Missing costs, unsold output, or inaccurate inputs can change the result.
- Supplier, harvest-date, grade, order, and quantity information is user-entered or simulated; it is not independently verified.
- Scenario inputs are not saved after the session. Persistent history and learning from comparable batches are possible future work, not part of this prototype.

## Two-day build priority

1. Build one responsive screen flow for one buyer order, three offers of the same input form, one capacity constraint, and editable low/typical/high conversion assumptions.
2. Implement a Next.js API route to validate the scenario and compare the seven possible non-empty all-or-nothing offer combinations. Calculate output using form-specific conversion assumptions, enforce the drying-capacity limit, count sales only up to the entered order quantity, and return contribution ranges, walk-away prices, and reasons combinations fail.
3. Show Plan A (highest typical contribution) and Plan B (meets the user’s target under low yield), if a Plan B exists.
4. Add one live price or capacity control that visibly changes the recommendation, contribution range, and explanation.
5. Polish the result screen and demo with simulated data. Keep accounts, databases, persistent records, and model training out of the two-day build.

## Technical stack

- **Next.js App Router + TypeScript:** UI plus a server-side Route Handler for the optimizer. [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- **Session-only scenario state:** no database is needed for this prototype because offers and results are not saved after the session.
- **Vercel:** optional hosting for the Next.js app.

This gives the prototype a real backend computation without spending the two-day build on persistent recordkeeping. The optimizer uses explicit rules and user-entered or simulated values; no machine-learning model is claimed.

## References

1. Dio, J. R. V., Dio, R. V., & Lacson, D. C. F. (2025). [“From Fruit to Nut: Revisiting Pili Nut (*Canarium ovatum* Engl.) Production Capacities and Value-Adding Activities in Sorsogon, Philippines.” *The Philippine Agricultural Scientist*, 108(4)](https://www.ukdr.uplb.edu.ph/pas/vol108/iss4/7/). Reports a value-chain analysis based on interviews with 15 key informants and identifies supply-capacity, storage, and market-linkage constraints.
2. Latoza, S. B. P. (2023). [*Value Chain Analysis of Pili Nuts (Canarium ovatum) in Sorsogon, Philippines*](https://www.ukdr.uplb.edu.ph/etd-undergrad/11754/). UPLB undergraduate thesis. Describes stakeholder relationships, product forms and routes, informal transactions, and issues including price fluctuation and marketing. The repository notes that full-text access is restricted to UP Gmail accounts.
3. Torres, E. E. (2025). [*Environmental and Economic Analysis of Post-Harvest Technological Progress of Pili Processing in the Bicol Region, Philippines*](https://www.ukdr.uplb.edu.ph/etd-grad/4072/). UPLB PhD dissertation record. Its abstract describes a study including 110 processors and 120 farmers and discusses processing stages, resource use, and machinery economics. The repository indicates the full document is not available there.
4. Department of Agriculture Regional Field Office V. (2023). [“Exploring the Potential of Bicol’s Pili Nut as an Export Product.”](https://bicol.da.gov.ph/exploring-the-potential-of-bicols-pili-nut-as-an-export-product/) Provides regional pili context and product-composition information. Composition figures are not used by BatchPilot as processor-specific yield predictions.
