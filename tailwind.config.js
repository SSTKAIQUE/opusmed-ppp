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
                            paper: '#F5F6F8',
                            status: {
                                        amber:    '#A15C07',
                                        amberBg:  '#FDF1DE',
                                        green:    '#0F7B55',
                                        greenBg:  '#E6F5EE',
                                        red:      '#B42318',
                                        redBg:    '#FDECEA',
                                        blue:     '#1D5FA8',
                                        blueBg:   '#E7F0FB',
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
