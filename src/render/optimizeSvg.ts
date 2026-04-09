import { optimize } from 'svgo';

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
        name: 'preset-default',
        params: {
          overrides: {
            convertShapeToPath: false,
            cleanupIds: false
          }
        }
      },
      {
        name: 'cleanupIds',
        params: {
          preserve: ['title', 'desc']
        }
      },
      'cleanupListOfValues',
      'sortDefsChildren',
      'sortAttrs'
    ]
  });

  return result.data;
}
