import { DocumentItem, UserProfile, GroundingMessage } from './types';

export const initialUserProfile: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex@documind.ai',
  title: 'Principal Knowledge Architect',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB2zPhNMYU6BYl5njWPy3NQ65Kw0t0GUMAQhp0LnGhHSbmSQsGjaZS8F-JZs5fj1Wxum6P1tWDNZREDlFEN35HjA0bdNBNO-QTuiWk7mgGBsuQBkCMNlpz5sXcmGrug2DvfUXYaATDXvrrdBD7q6-SniUNAd-dpqArkiB22zco_Xpb82v21HLjYfD7POsLQl3asMf2VMi_Ig0wAJRJac7SZbiEzhtoIyTxfruswf1QqDIjyA1EBd8K4Sw',
  identityProvider: 'OAuth2 Internal',
  tier: 'Pro Tier',
  embeddingUsage: {
    used: 420000,
    total: 1000000,
  },
};

export const initialDocuments: DocumentItem[] = [];

export const initialMessages: GroundingMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    authorName: 'Alex Rivera',
    timestamp: '10:42 AM',
    content: 'What methodology does the paper use to compute multi-head attention?',
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    authorName: 'DocuMind Intelligence',
    timestamp: '10:42 AM',
    retrievalTime: '0.48s retrieval',
    isStrictlyGrounded: true,
    content: `The paper computes multi-head attention by linearly projecting the queries, keys, and values h times with different, learned linear projections to d_k, d_k, and d_v dimensions, respectively [1].

On each of these projected versions of queries, keys, and values, the attention function is performed in parallel, yielding d_v-dimensional output values [2]. These are concatenated and once again projected, resulting in the final values [3].`,
    citations: [
      {
        id: 1,
        label: '1',
        sourceText: 'Page 4: "Multi-Head Attention consists of..."',
        pageNumber: 4,
        chunkId: 'chunk-23',
      },
      {
        id: 2,
        label: '2',
        sourceText: 'Page 5: "Scaled Dot-Product Attention..."',
        pageNumber: 5,
        chunkId: 'chunk-28',
      },
      {
        id: 3,
        label: '3',
        sourceText: 'Page 5: "In this work we employ h = 8..."',
        pageNumber: 5,
        chunkId: 'chunk-31',
      },
    ],
  },
];

// Convenience Aliases
export const mockDocuments = initialDocuments;
export const mockChatHistory = initialMessages;
export const defaultUserProfile = initialUserProfile;
