"use client"

import { useState } from 'react'
import { FolderOpen, Search, Grid, List, X, Plus, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MetallicButton } from '@/components/ui/metallic-button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/date-utils'
import useSWR from 'swr'
import { fetcher } from '@/lib/get-fetcher'
import { CreateCollectionModal } from '@/components/library/create-collection-modal'
import { UploadModal } from '@/components/library/upload-modal'

interface Collection {
  id: string
  name: string
  description: string
  document_count: number
  created_at: string
  updated_at: string
}

export default function LibraryPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  // Fetch collections from API
  const { data, error: swrError, isLoading, mutate } = useSWR('/collections', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const collections: Collection[] = data?.collections ?? []

  // Handle various error formats
  let error: string | null = null
  if (swrError) {
    if (swrError?.message) {
      error = typeof swrError.message === 'string' ? swrError.message : 'Failed to load collections'
    } else if (swrError?.detail) {
      if (typeof swrError.detail === 'string') {
        error = swrError.detail
      } else if (typeof swrError.detail === 'object' && swrError.detail.error) {
        error = swrError.detail.error
      }
    } else {
      error = 'Failed to load collections'
    }
  }

  // Filter collections based on search
  const filteredCollections = collections.filter((collection: Collection) => {
    const matchesSearch = searchQuery === '' ||
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleCollectionClick = (collectionId: string) => {
    router.push(`/library/documents?collection=${collectionId}`)
  }

  const handleCreateCollection = () => {
    setShowCreateModal(true)
  }

  const handleCollectionCreated = () => {
    // Refresh the collections list
    mutate()
  }

  const handleUploadToCollection = (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to collection
    setSelectedCollectionId(collectionId)
    setShowUploadModal(true)
  }

  const handleUploadSuccess = () => {
    // Refresh the collections list to update document counts
    mutate()
  }

  return (
    <>
      <CreateCollectionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCollectionCreated}
      />

      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        collectionId={selectedCollectionId}
        onOptimisticUpdate={handleUploadSuccess}
      />

      <div className="w-full max-h-[97vh]">
        <div className='bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10'>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-black/10 border border-white/10 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <MetallicButton type="button" onClick={handleCreateCollection}>
              <Plus className="w-4 h-4" />
              <span>Create Collection</span>
            </MetallicButton>
          </div>
        </div>

        {/* Results count */}
        {searchQuery && (
          <div className="mb-4 text-sm text-white/60 flex-shrink-0">
            Found {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-white/15 bg-card">
                    <Skeleton className="h-12 w-12 mb-3 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-t from-red-500/10 to-red-500/20 border border-red-500/30 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">Failed to load collections</h3>
              <p className="text-sm text-white/50 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-6">
                <FolderOpen className="w-10 h-10 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold text-white/90 mb-3">
                No collections yet
              </h3>
              <p className="text-sm text-white/60 mb-8 max-w-md">
                Create your first collection to organize your documents and start building your knowledge base.
              </p>
              <MetallicButton type="button" onClick={handleCreateCollection} className="px-6 py-3 gap-3">
                <Plus className="w-4 h-4" />
                <span>Create Your First Collection</span>
              </MetallicButton>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">
                No collections found
              </h3>
              <p className="text-sm text-white/50 mb-4">
                {searchQuery
                  ? `No collections match "${searchQuery}"`
                  : 'Try adjusting your search'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
              {filteredCollections.map((collection: Collection) => (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="group relative bg-card hover:bg-white/5 border border-white/15 hover:border-white/20 rounded-lg p-4 transition-all duration-200 cursor-pointer overflow-hidden h-full flex flex-col"
                >
                  {/* Top Right Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {/* Upload Button */}
                    <button
                      onClick={(e) => handleUploadToCollection(collection.id, e)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-all duration-200 border border-white/10"
                      title="Upload documents to this collection"
                    >
                      <Plus className="w-3.5 h-3.5 text-white/70" />
                    </button>

                    {/* Document Count Badge */}
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/10 text-white/70 border border-white/10">
                      {collection.document_count}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 flex-1">
                    {/* Collection Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-6 h-6 text-white/60" />
                    </div>

                    {/* Collection Info */}
                    <div className="flex-1">
                      <h3
                        className="text-sm font-medium text-white/90 mb-1 pr-12 line-clamp-2 leading-tight"
                        title={collection.name}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {collection.name}
                      </h3>
                      <p className="text-xs text-white/50 line-clamp-2">
                        {collection.description}
                      </p>
                    </div>

                    {/* Collection Stats */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>{collection.document_count} document{collection.document_count !== 1 ? 's' : ''}</span>
                        <span>{formatRelativeTime(collection.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {filteredCollections.map((collection: Collection) => (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="group flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-white/5 border border-white/15 hover:border-white/20 transition-all duration-200 cursor-pointer"
                >
                  {/* Collection Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-6 h-6 text-white/60" />
                  </div>

                  {/* Collection Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">
                      {collection.name}
                    </h3>
                    <p className="text-xs text-white/50 truncate mt-1">
                      {collection.description}
                    </p>
                  </div>

                  {/* Collection Stats and Actions */}
                  <div className="flex items-center gap-4 text-xs text-white/50 flex-shrink-0">
                    <span>{collection.document_count} document{collection.document_count !== 1 ? 's' : ''}</span>
                    <span className="hidden sm:block">{formatRelativeTime(collection.updated_at)}</span>

                    {/* Upload Button */}
                    <button
                      onClick={(e) => handleUploadToCollection(collection.id, e)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-all duration-200 border border-white/10"
                      title="Upload documents to this collection"
                    >
                      <Plus className="w-3.5 h-3.5 text-white/70" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
