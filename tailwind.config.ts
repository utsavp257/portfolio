import type { Config } from 'tailwindcss';


const config: Config = {
content: [
'./app/**/*.{ts,tsx}',
'./components/**/*.{ts,tsx}',
'./pages/**/*.{ts,tsx}',
],
theme: {
extend: {
colors: {
brand: {
red: '#ff2d2d',
black: '#0b0b0b',
gray: '#eaeaea'
}
},
boxShadow: {
soft: '0 10px 30px rgba(0,0,0,0.10)'
}
},
},
plugins: [],
};
export default config;