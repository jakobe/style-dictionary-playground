const componentToCss = {
  name: "css/component",
  formatter: ({ dictionary }) => {
    const [rootKey, rootValue] = Object.entries(dictionary.tokens)[0];
    const hostComponentSelector = `[component=${rootKey}]`;
    const baseSelector = `${hostComponentSelector}[part="base"]`;
    const indentWidth = "  ";

    const getSelector = (selector, prefix) => {
      return prefix ? `${prefix} ${selector}` : selector;
    };

    const renderCssDeclaration = (prop) => {
      if (!!prop.name) {
        const cssAttribute = prop.name.split("|").pop();
        const comment = prop.comment ? ` /* ${prop.comment} */` : "";
        return `${cssAttribute}: ${prop.value};${comment}`;
      }
    };

    const renderCssDeclarationBlock = (props, depth) => {
      if (!props) return;
      const declarations = Object.values(props)
        .map(renderCssDeclaration)
        .filter(Boolean);
      if (!declarations || declarations.length === 0) return;
      const indent = indentWidth.repeat(depth);
      const declarationSeparator = `\n${indent}`;
      return `${indent}${declarations.join(declarationSeparator)}`;
    };

    const renderCssRuleset = (props, depth, selector) => {
      const indent = indentWidth.repeat(depth);
      const declarationBlock = renderCssDeclarationBlock(props, depth + 1);
      if (!declarationBlock) return;
      return `${indent}${selector} {
${declarationBlock}
${indent}}`;
    };

    const renderBaseStyles = (prop, depth, selectorPrefix) => {
      const selector = getSelector(baseSelector, selectorPrefix);
      const baseStyles = prop["baseStyle"];
      return renderCssRuleset(baseStyles, depth, selector);
    };

    const renderParts = (prop, depth, selectorPrefix) => {
      const parts = prop["parts"];
      if (!parts) return;

      const partsStyleDeclarations = Object.entries(parts).map(
        ([part, partsStyles]) => {
          const partSelector = `${hostComponentSelector} [part="${part}"]`;
          const selector = getSelector(partSelector, selectorPrefix);
          return renderCssRuleset(partsStyles, depth, selector);
        }
      );

      return partsStyleDeclarations.join(`\n`);
    };

    const renderStates = (prop, depth, selectorPrefix) => {
      const states = Object.entries(prop).filter(([key]) =>
        ["_hover", "_active", "_focus", "_checked"].includes(key)
      );
      if (!states) return;

      const stateStyleDeclarations = states.map(
        ([prefixedState, stateStyles]) => {
          const state = prefixedState.substring(1);
          const stateSelector = ["checked"].includes(state)
            ? `[${state}]`
            : `:${state}`;

          // const partSelector = `[part="${state}"]`;
          // const selector = getSelector(stateSelector, selectorPrefix);
          const selector = `:host(${stateSelector})`;
          const stateRuleSet = renderCssRuleset(stateStyles, depth, selector);
          const statePartsStyles = renderParts(stateStyles, depth, selector);

          return [stateRuleSet, statePartsStyles].filter(Boolean).join("\n");
        }
      );

      return stateStyleDeclarations.join(`\n`);
    };

    const renderProps = (prop, selectorPrefix) => {
      const depth = 1;
      const baseStyleRule = renderBaseStyles(prop, depth);
      const partsStyleRules = renderParts(prop, depth);
      const stateStyleRules = renderStates(prop, depth);

      const ruleSet = [baseStyleRule, partsStyleRules, stateStyleRules]
        .filter(Boolean)
        .join("\n");
      return ruleSet;
    };

    const cssRules = renderProps(rootValue);

    return cssRules;
  },
};

export const customFormats = [componentToCss];
