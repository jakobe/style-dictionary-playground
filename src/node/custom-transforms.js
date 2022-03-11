const sizeRem = {
  name: "size/rem",
  type: "value",
  matcher: function (prop) {
    // TODO: Only transform on specific types and categories:
    //  const isSizeType = (prop) =>
    //    [
    //      "fontSizes",
    //      "lineHeights",
    //      "spacing",
    //      "borderRadius",
    //      "borderWidths",
    //      "sizing",
    //    ].includes(prop.type);
    //  const isTypographySize = (prop) =>
    //    prop.attributes.category === "typography" &&
    //    ["lineHeight", "fontSize"].includes(prop.attributes.subitem);
    //  return isSizeType(prop) || isTypographySize(prop);
    return !isNaN(prop.original.value);
  },
  transformer: function (prop, options) {
    // You can also modify the value here if you want to convert pixels to ems
    const basePxFontSize = options?.basePxFontSize || 16;
    const pxValueToRem = (pxValue) => pxValue / basePxFontSize;
    return prop.original.value && prop.original.value.toString().endsWith("%")
      ? prop.original.value
      : pxValueToRem(parseFloat(prop.original.value)) + "rem";
  },
};

const nameCtiPipeKebab = {
  name: "name/cti/pipeKebab",
  type: "name",
  transformer: function (token, options) {
    const upperToHyphenLower = (match, offset) => {
      return (offset > 0 ? "-" : "") + match.toLowerCase();
    };

    const camelCaseToKebab = (input) =>
      input.replace(/[A-Z]/g, upperToHyphenLower);

    const getPathName = (path) => {
      let transformedPathName = path;
      if (isNaN(path)) {
        transformedPathName = camelCaseToKebab(path);
        const pathPrefix = path[0];
        if (["_"].includes(pathPrefix)) {
          transformedPathName = pathPrefix + transformedPathName;
        }
      }
      return transformedPathName;
    };

    const tokenSeparator = options.tokenSeparator || "|";
    const transformed = (options.prefix ? [options.prefix] : [])
      .concat(token.path)
      .map(getPathName)
      .join(tokenSeparator);
    return transformed;
  },
};

export const customTransforms = [sizeRem, nameCtiPipeKebab];
