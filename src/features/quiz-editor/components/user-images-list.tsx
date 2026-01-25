import { Loader2, X } from 'lucide-react';
import { use } from 'react';

import { Button } from '@/components/button';
import { toast } from '@/components/toast';
import { useDeleteImage, useImages, useLoadMoreImages } from '@/hooks/use-api';
import { getOptimizedImageUrl } from '@/lib/image-optimization';
import { cn } from '@/lib/utilities';

interface UserImagesListProperties {
	userId: string;
	selectedImage: string | undefined;
	onSelectImage: (image: string) => void;
}

export function UserImagesList({ userId, selectedImage, onSelectImage }: UserImagesListProperties) {
	const imagesQuery = useImages(userId);
	const imagesData = use(imagesQuery.promise);

	const loadMoreImagesMutation = useLoadMoreImages();
	const deleteImageMutation = useDeleteImage();

	const aiImages = imagesData?.images ?? [];
	const aiImagesCursor = imagesData?.nextCursor;
	const isLoadingMoreImages = loadMoreImagesMutation.isPending;

	const loadMoreImages = () => {
		if (!aiImagesCursor || isLoadingMoreImages) return;
		loadMoreImagesMutation.mutate({ userId, cursor: aiImagesCursor });
	};

	const deleteImage = (imageId: string) => {
		deleteImageMutation.mutate(
			{ userId, imageId },
			{
				onSuccess: () => {
					toast.success('Image deleted');
				},
				onError: (error) => toast.error(error.message || 'Failed to delete image'),
			},
		);
	};

	if (aiImages.length === 0) {
		return;
	}

	return (
		<div className="space-y-2">
			<h4 className="text-sm font-medium text-muted-foreground">AI Generated</h4>
			<div className="grid grid-cols-3 gap-2">
				{aiImages.map((img) => (
					<div key={img.id} className="group relative">
						<Button
							type="button"
							variant="subtle"
							onClick={() => onSelectImage(img.path)}
							className={cn(
								`aspect-video h-auto w-full overflow-hidden p-0`,
								selectedImage === img.path ? `ring-3 ring-orange ring-offset-2 ring-offset-background` : 'bg-muted text-muted-foreground',
							)}
							aria-label={img.name}
						>
							<img src={getOptimizedImageUrl(img.path, { width: 400 })} alt={img.name} className="size-full object-cover" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={(event) => {
								event.stopPropagation();
								deleteImage(img.id);
							}}
							className={`
								absolute top-1 right-1 size-6 rounded-full border-0 bg-black/60 p-1
								text-white opacity-0 transition-opacity
								hover:bg-red
								group-hover-always:opacity-100
							`}
							aria-label="Delete image"
						>
							<X className="size-3" />
						</Button>
					</div>
				))}
			</div>
			{aiImagesCursor && (
				<Button type="button" variant="subtle" size="sm" className="w-full" onClick={loadMoreImages} disabled={isLoadingMoreImages}>
					{isLoadingMoreImages ? <Loader2 className="mr-2 size-4 animate-spin" /> : undefined}
					Load More
				</Button>
			)}
		</div>
	);
}
