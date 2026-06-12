/**
 * Flipfinder miniature: a refurbished-phone price-intelligence tool rebuilt
 * as a two-screen demo. Screen 1 ranks the top movers across the synthetic
 * universe; screen 2 is the model workspace (smart filters, price chart,
 * breakdowns, margin calculator). Navigation is plain view state, no router.
 */
import * as React from "react";
import { UNIVERSE, modelByCode, type Combo, type Selection } from "./data";
import { combosFor } from "./logic";
import TopMovers from "./TopMovers";
import ModelDetails from "./ModelDetails";

type View =
  | { kind: "movers" }
  | { kind: "model"; modelCode: string; selection: Selection };

export default function FlipfinderDemo() {
  const [view, setView] = React.useState<View>({ kind: "movers" });

  const openCombo = React.useCallback((combo: Combo) => {
    setView({
      kind: "model",
      modelCode: combo.modelCode,
      selection: { storage: combo.storage, grade: combo.grade, colour: combo.colour },
    });
  }, []);

  const model = view.kind === "model" ? modelByCode(view.modelCode) : undefined;
  const combos = React.useMemo(
    () => (model ? combosFor(UNIVERSE, model.code) : []),
    [model]
  );

  return (
    <div className="w-full">
      {view.kind === "movers" || !model ? (
        <TopMovers onOpenCombo={openCombo} />
      ) : (
        <ModelDetails
          model={model}
          combos={combos}
          selection={view.selection}
          onSelectionChange={(selection) =>
            setView((v) => (v.kind === "model" ? { ...v, selection } : v))
          }
          onBack={() => setView({ kind: "movers" })}
        />
      )}

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        production charts with Recharts; this miniature re-renders in raw SVG to match the page.
        the regression and both TVA formulas are the production maths. the top movers are
        computed live from the synthetic universe. every price is synthetic.
      </p>
    </div>
  );
}
