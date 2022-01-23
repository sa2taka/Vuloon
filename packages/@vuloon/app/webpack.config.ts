import main from './webpack/webpack.main';
import renderer from './webpack/webpack.renderer';
import preload from './webpack/webpack.preload';

const config = [main, renderer, preload];

export default config;
