/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
          './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
          './src/components/**/*.{js,ts,jsx,tsx,mdx}',
          './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        ],
    theme: {
          extend: {
                  colors: {
                            navy: {
                                        DEFAULT: '#1B3A5C',
                                        light:   '#2C628A',
                                        dark:    '#0A1826',
                                        mid:     '#15304C',
                            },
                            brass: {
                                        DEFAULT: '#9C7A3F',
                                        soft:    '#C9AD78',
                            },
                            ink: '#0E1B26',
                            paper: '#F4F5F3',
                            status: {
                                        amber:    '#9A6425',
                                        amberBg:  '#F8EFE3',
                                        green:    '#1E6E4F',
                                        greenBg:  '#E9F3ED',
                                        red:      '#A83B2A',
                                        redBg:    '#F8EAE7',
                                        blue:     '#2C628A',
                                        blueBg:   '#E9EFF3',
                            },
                  },
                  fontFamily: {
                            sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                            serif: ['var(--font-source-serif)', 'Georgia', 'serif'],
                            mono: ['var(--font-plex-mono)', 'monospace'],
                  },
          },
    },
    plugins: [],
};
