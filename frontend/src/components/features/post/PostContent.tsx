import type { Post } from '../../../types'
import { Badge } from '../../common/Badge'

export const PostContent = ({ post }: { post: Post }) => (
  <div className="bg-white px-4 py-5">
    <div className="mb-2">
      <Badge label={post.category} />
    </div>
    <h2 className="mb-2 text-lg font-bold text-gray-900">{post.title}</h2>
    <div className="mb-4 flex items-center gap-1 text-xs text-gray-400">
      <span>{post.complexName}_익명</span>
      <span>·</span>
      <span>{post.createdAt}</span>
    </div>
    <p className="text-sm leading-relaxed text-gray-700">{post.content}</p>
  </div>
)
