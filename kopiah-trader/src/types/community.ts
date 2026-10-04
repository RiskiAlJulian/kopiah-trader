export type PostCategory = 'General' | 'Analysis' | 'Education' | 'Journal' | 'Discussion'
export const CATEGORIES: PostCategory[] = ['General', 'Analysis', 'Education', 'Journal', 'Discussion']

export interface Post {
  id: string
  userId: string
  username: string
  category: PostCategory
  content: string
  createdAt: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  bookmarkedByMe: boolean
}

export interface Comment {
  id: string
  userId: string
  username: string
  content: string
  createdAt: string
}
