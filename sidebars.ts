import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
    docsSidebar: [
        {
            type: 'doc',
            id: 'index',
            label: 'Introduction',
        },
        {
            type: 'category',
            label: 'Getting Started',
            collapsed: false,
            items: [
                'guides/quick-start',
                'guides/integration',
                'guides/examples',
            ],
        },
        {
            type: 'category',
            label: 'SDK',
            collapsed: false,
            items: [
                'sdk/index',
                'sdk/installation',
                'sdk/wallet-auth',
                'sdk/social-auth',
                'sdk/api-reference',
                'sdk/types',
                'sdk/error-handling',
                'sdk/ethos-api',
                'sdk/score-validation',
            ],
        },
        {
            type: 'category',
            label: 'React',
            collapsed: false,
            items: [
                'react/index',
                'react/installation',
                'react/auth-modal',
                'react/sign-in-button',
                'react/hooks',
                'react/styling',
                'react/types',
            ],
        },
        {
            type: 'category',
            label: 'Providers',
            collapsed: false,
            items: [
                'providers/index',
                'providers/configuration',
            ],
        },
        {
            type: 'category',
            label: 'Guides',
            collapsed: true,
            items: [
                'guides/troubleshooting',
                'guides/faq',
            ],
        },
    ],
};

export default sidebars;
