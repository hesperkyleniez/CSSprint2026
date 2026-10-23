# Talli

**Talli is a buying-decision simulator for pili processors and cooperatives in Sorsogon.** In a focused two-day demo, a processor enters one buyer order, three supplier offers, one capacity bottleneck, and uncertain yields. Talli reveals the best typical-yield plan, checks whether a more conservative plan can still meet the target under low yield, and shows why each plan wins or fails.

> **Prototype notice:** Any sample offers, prices, yields, costs, orders, and capacities included in the demo are simulated unless explicitly identified as sourced data. The system does not claim to use verified Sorsogon operating data or to guarantee profit.

## Run the demo

```bash
npm install
npm run dev
```

On a phone, the form is four steps: **Buyer order**, **Supplier offers**, **Capacity & costs**, then **Review**. **Compare offers** is on the review step. On a wide screen, every section is on one page, and **Compare offers** sits with the capacity fields.

Choose **Use simulated demo**. That loads a simulated fresh-fruit scenario:

- 50 kg dried nut-in-shell order at ₱500/kg
- Offer A, Simulated farmer: 100 kg at ₱80/kg
- Offer B, Simulated trader: 60 kg at ₱20/kg
- Offer C left blank
- 200 kg drying capacity, ₱10/kg processing cost, a ₱3,000 target
- Yields of 0.35 / 0.5 / 0.6 kg of dried nut-in-shell per kg of fresh pili

Plan A and Plan B are the same mix: accept Offer A. Typical contribution is ₱16,000. Low-yield contribution is ₱8,500, which meets the ₱3,000 target, and the mix uses 100 kg of the 200 kg drying capacity. At low yield, that mix still meets the target if the fresh pili averages no more than ₱135/kg. Offer B alone covers 60% of the order at typical yield, so Talli does not recommend it. Accepting A and B uses 160 kg and a lower typical contribution (₱14,200), because sales stop at the 50 kg order.

After the demo comparison, type **136** in **Offer A asking price**. The browser sends the scenario to `POST /api/optimize` again. Plan A stays Offer A, because that mix still has the higher typical contribution. Plan B becomes Offers A and B, because Offer A alone no longer clears ₱3,000 when yield is low. Drop **drying capacity** below 100 kg and Plan A moves from Offer A to no feasible mix: Offer A no longer fits, and Offer B still does not cover the order. These figures are simulated sample inputs. The prototype does not save the scenario.

## The problem

Pili moves through several product forms and stakeholders before becoming a consumer product. For a processor facing multiple supplier offers, a buyer order, and limited capacity at a processing step such as drying, the buying decision is not simply which offer has the lowest price. The processor must consider the quantity and form offered, expected saleable output, processing costs, order requirements, and the possibility that actual yield will be lower than expected.

A 2025 study of the Sorsogon pili value chain reports that supply exceeds the daily quantity required by Bicol-based processors and associates underutilization and post-harvest losses with limited storage and market linkages. A 2023 UPLB thesis describes multiple routes for fresh pili, shelled pili, kernels, and processed products; it also reports weak direct connections between farmers and processors, with traders often acting as middlemen. These findings motivate the project, but do not validate Talli’s calculations or prove that the app alone can solve the wider storage and market-access problems.

**Problem statement:** When several pili offers compete for limited processing capacity and a buyer order, small processors and cooperatives need a way to compare feasible buying plans under uncertain yield and price assumptions. Without that comparison, they may not see which combination fits the order, what each plan could earn under low, typical, or high yield, or how much they can afford to pay.

## Project overview

Talli is designed around one buying decision at a time. The user selects one pathway, then enters one buyer order, up to three offers of that same input, the available capacity for that pathway’s bottleneck, and low, typical, and high conversion assumptions. Quantities can be kilograms, or a named unit such as a sack or kaing, with the user’s own estimate of how many kilograms are in one unit. The server-side optimizer compares the offer combinations, displays output and contribution ranges with limiting constraints, calculates a walk-away price, and updates the plans when a compared price or capacity changes.

The central question is: **“Given these offers and my capacity, which combination should I accept, and what is the highest price I can afford to pay?”** Talli explains its recommendation; the processor makes the final decision. The prototype is a session-based simulator, not a records-management app: it does not require an account or save scenario data after the session.

### Who it is for

- **Primary users:** small pili processors and pili-processing cooperatives in Sorsogon.
- **Other possible suppliers:** farmers, traders, or cooperatives offering pili to a processor.
- **Not the primary user:** a retail shop selling packaged pili snacks. That business has different inventory and sales decisions.

The conversion assumption is specific to the selected pathway. The prototype has two: fresh fruit with pulp → dried nut-in-shell, limited by drying capacity, and dried nut-in-shell → kernel, limited by shelling capacity. These routes do not share a yield rate. A scenario compares offers of the same input so their estimates stay comparable. Any conversion ranges are user-entered or simulated, not published local constants.

## End-to-end system flow

1. **Enter one buyer order.** Choose the pathway and whether quantities are kilograms or a named unit. Enter the order quantity and selling price. A loaded demo is labeled **Sample order**; anything else is **Your order**.
2. **Enter up to three supplier offers.** For each offer, enter a source, quantity, and asking price. Leave a row blank when there are fewer than three. Every offer uses the selected pathway, so yield and capacity stay comparable. Each offer is accepted or declined as a whole; partial-quantity negotiation is out of scope. Offers are scenario inputs, not verified transactions.
3. **Set capacity, costs, and target.** Enter the available capacity for the pathway’s bottleneck, the variable processing cost, and the least the processor wants to clear if yield comes out low. These are editable scenario values, not claimed Sorsogon industry benchmarks.
4. **Set pathway-specific conversion uncertainty.** Enter low, typical, and high kilograms of output from 1 kg of input. Yields must be greater than 0 and at most 1. At cold start, these values are typed in or loaded from the simulated demo. The app does not claim they are locally calibrated.
5. **Run the server-side optimizer.** The browser sends the scenario to a Next.js API route. The route validates the inputs, converts named units to kilograms, and evaluates every combination of the entered offers, including declining all of them.
6. **Reveal two plans.** **Plan A** is the capacity-feasible mix that covers the full order at typical yield and has the highest positive typical contribution. **Plan B** must cover the full order at low yield, clear the target, and stay above ₱0. If Plan A already does that, both plans are the same mix. If no such mix exists, the app says so instead of inventing a safe plan. Declining every offer is the ₱0 baseline. Loss-making mixes and partial fulfillment are not recommended.
7. **Show why.** The result shows selected offers, capacity used, low/typical/high output and contribution, order coverage, unmatched output, and a low-yield walk-away price. Revenue is counted only for output matched to the entered order; extra output is unmatched, not assumed sold. On a phone, the longer metrics, rationale, offer comparison, and what-if fields open from **See details**.
8. **Try another price or capacity.** After a comparison, type a new Offer A price or capacity. The browser resubmits the scenario, and the plans, contribution range, and reasons update. In the demo, ₱136 on Offer A keeps Plan A on Offer A and moves Plan B to Offers A and B.
9. **End the session.** The user can reset or try another scenario. The prototype does not save offers, orders, or results after the session.

## Core calculations and upgrades

### 1. Yield range and estimate quality

Talli represents output as a **low / typical / high range**, rather than a single certain number. In this prototype, the user enters the range or uses clearly labeled simulated values. The app identifies the range as manual or simulated and shows its effect on the buying plan. It does not treat a published fruit-composition figure as a verified saleable-kernel yield. Learning from comparable past batches is future scope, after real records are available.

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

The processor sets a target contribution. The headline walk-away price uses the **low-yield** case, with sales capped at the entered order:

```text
Maximum purchase price/kg =
  (low-yield order-backed sales − processing costs − target contribution) ÷ input kilograms
```

If that amount is negative, the walk-away price is left blank. The plan details also show a ceiling for each selected supplier, holding the other selected offers at their entered prices. The result changes with the yield range, selling price, and cost assumptions.

### 4. Price-sensitivity “what if”

After a comparison, Offer A’s asking price and the bottleneck capacity are editable numbers. Changing either one resubmits the scenario and refreshes the plans. This supports comparison; it is not a forecast that the processor can sell at the entered price.

## Scope

### Included in the prototype

- One session-based buying scenario with one buyer order, up to three supplier offers, and one capacity constraint.
- One selected pathway per scenario. The two pathways are fresh fruit with pulp → dried nut-in-shell, and dried nut-in-shell → kernel.
- Quantities in kilograms, or in a named unit with the user’s kilogram-per-unit estimates. Talli converts those counts before it compares.
- User-entered low, typical, and high yield assumptions, prices, and costs.
- A **Sample order** label on the simulated demo, and **Your order** on anything else.
- A capacity-constrained offer-mix planner with a typical-yield Plan A and a low-yield Plan B.
- A server-side optimization API that validates scenario inputs and returns plans and explanations.
- Order coverage and unmatched output, with sales counted only up to the entered order quantity.
- A low-yield walk-away price, left blank when the target cannot be cleared, plus per-supplier ceilings.
- A results view explaining selected offers, capacity use, contribution range, and ruled-out mixes.
- A phone flow with four steps and a review screen, and one compact page on a wide screen.
- After a comparison, editable Offer A price and capacity fields that refresh the plans.
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

- Published sources establish relevant value-chain context, but do not provide enough processor-specific input data to calibrate Talli’s yield, cost, or capacity estimates.
- The 2025 Sorsogon value-chain study is based on purposive interviews with 15 key informants. Its reported regional findings should not be treated as a measurement of every processor’s business.
- At cold start, yield ranges and costs are manual or simulated assumptions. They are not estimates learned from local processors’ historical records.
- The low, typical, and high scenarios are not calibrated probabilities or confidence intervals. They make uncertainty visible for scenario comparison.
- The optimizer can only account for constraints and demand entered by the user. It does not fix physical storage shortages or limited market access.
- Walk-away prices and contribution ranges are scenario calculations. Missing costs, unsold output, or inaccurate inputs can change the result.
- Supplier, harvest-date, grade, order, and quantity information is user-entered or simulated; it is not independently verified.
- Scenario inputs are not saved after the session. Persistent history and learning from comparable batches are possible future work, not part of this prototype.

## Two-day build priority

1. One responsive flow for one buyer order, up to three offers of the same pathway, one capacity constraint, and editable low/typical/high conversion assumptions. Phones step through the form; wide screens keep it on one page.
2. A Next.js API route that validates the scenario, converts named units to kilograms, and compares every all-or-nothing combination, including declining all offers. Output uses the pathway’s conversion assumptions, capacity is a hard limit, sales stop at the entered order, and the response includes contribution ranges, walk-away prices, and reasons mixes fail.
3. Plan A is the highest positive typical contribution among mixes that cover the full order. Plan B covers the full order at low yield and meets the target, when such a mix exists.
4. After a comparison, Offer A’s price and the capacity can be typed in again. The plans, contribution range, and explanation update.
5. The result screen and demo use simulated data. Accounts, databases, persistent records, and model training stay out of the prototype.

## Technical stack

- **Next.js App Router + TypeScript:** UI plus a server-side Route Handler for the optimizer. [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- **Session-only scenario state:** no database is needed for this prototype because offers and results are not saved after the session.
- **Local app:** `npm install`, then `npm run dev`. The optimizer runs in the Next.js route on that same app.

This gives the prototype a real backend computation without spending the two-day build on persistent recordkeeping. The optimizer uses explicit rules and user-entered or simulated values; no machine-learning model is claimed.

## References

1. Dio, J. R. V., Dio, R. V., & Lacson, D. C. F. (2025). [“From Fruit to Nut: Revisiting Pili Nut (_Canarium ovatum_ Engl.) Production Capacities and Value-Adding Activities in Sorsogon, Philippines.” _The Philippine Agricultural Scientist_, 108(4)](https://www.ukdr.uplb.edu.ph/pas/vol108/iss4/7/). Reports a value-chain analysis based on interviews with 15 key informants and identifies supply-capacity, storage, and market-linkage constraints.
2. Latoza, S. B. P. (2023). [_Value Chain Analysis of Pili Nuts (Canarium ovatum) in Sorsogon, Philippines_](https://www.ukdr.uplb.edu.ph/etd-undergrad/11754/). UPLB undergraduate thesis. Describes stakeholder relationships, product forms and routes, informal transactions, and issues including price fluctuation and marketing. The repository notes that full-text access is restricted to UP Gmail accounts.
3. Torres, E. E. (2025). [_Environmental and Economic Analysis of Post-Harvest Technological Progress of Pili Processing in the Bicol Region, Philippines_](https://www.ukdr.uplb.edu.ph/etd-grad/4072/). UPLB PhD dissertation record. Its abstract describes a study including 110 processors and 120 farmers and discusses processing stages, resource use, and machinery economics. The repository indicates the full document is not available there.
4. Department of Agriculture Regional Field Office V. (2023). [“Exploring the Potential of Bicol’s Pili Nut as an Export Product.”](https://bicol.da.gov.ph/exploring-the-potential-of-bicols-pili-nut-as-an-export-product/) Provides regional pili context and product-composition information. Composition figures are not used by Talli as processor-specific yield predictions.
