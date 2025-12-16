import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'Sign in with Ethos',
    tagline: 'Authentication with decentralized reputation',
    favicon: 'img/favicon.ico',

    url: 'https://ethos.thebbz.xyz',
    baseUrl: '/docs/',

    organizationName: 'thebbz',
    projectName: 'siwe-ethos',

    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',

    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    editUrl: 'https://github.com/thebbz/signinwithethos/tree/main/packages/',
                    routeBasePath: '/',
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        image: 'img/ethos-social-card.png',
        navbar: {
            title: 'Sign in with Ethos',
            logo: {
                alt: 'Ethos Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docsSidebar',
                    position: 'left',
                    label: 'Documentation',
                },
                {
                    to: '/docs/sdk/installation',
                    label: 'SDK',
                    position: 'left',
                },
                {
                    to: '/docs/react/installation',
                    label: 'React',
                    position: 'left',
                },
                {
                    href: 'https://github.com/thebbz/signinwithethos',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Documentation',
                    items: [
                        {
                            label: 'Getting Started',
                            to: '/docs/guides/quick-start',
                        },
                        {
                            label: 'SDK Reference',
                            to: '/docs/sdk/api-reference',
                        },
                        {
                            label: 'React Components',
                            to: '/docs/react/auth-modal',
                        },
                    ],
                },
                {
                    title: 'Packages',
                    items: [
                        {
                            label: 'SDK',
                            to: '/docs/sdk/installation',
                        },
                        {
                            label: 'React',
                            to: '/docs/react/installation',
                        },
                        {
                            label: 'Providers',
                            to: '/docs/providers',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/thebbz/signinwithethos',
                        },
                        {
                            label: 'Ethos Network',
                            href: 'https://ethos.network',
                        },
                        {
                            label: 'Demo App',
                            href: 'https://siwe-ethos-demo.vercel.app',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} thebbz. Built with Docusaurus.`,
        },
        prism: {
            theme: require('prism-react-renderer').themes.github,
            darkTheme: require('prism-react-renderer').themes.dracula,
            additionalLanguages: ['typescript', 'javascript', 'jsx', 'tsx', 'bash', 'json'],
        },
        colorMode: {
            defaultMode: 'dark',
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
