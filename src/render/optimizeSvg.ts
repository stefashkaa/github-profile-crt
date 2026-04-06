import { optimize } from "svgo";

export interface SvgOptimizationOptions {
  multipass: boolean;
}

export function optimizeGeneratedSvg(svg: string, options: SvgOptimizationOptions): string {
  const result = optimize(svg, {
    multipass: options.multipass,
    js2svg: {
      pretty: false,
      indent: 0
    },
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupIds: false,
            convertShapeToPath: false,
            removeUnknownsAndDefaults: false
          }
        }
      },
      "sortAttrs"
    ]
  });

  return result.data;
}
