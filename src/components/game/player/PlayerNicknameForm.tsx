import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LIMITS, nicknameSchema } from '@shared/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
	nickname: nicknameSchema,
});

type FormData = z.infer<typeof formSchema>;
interface PlayerNicknameFormProps {
	onJoin: (nickname: string) => void;
	isLoading: boolean;
}
export function PlayerNicknameForm({ onJoin, isLoading }: PlayerNicknameFormProps) {
	const formRef = useRef<HTMLFormElement>(null);
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isValid },
	} = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		defaultValues: { nickname: '' },
	});

	const nickname = useWatch({ control, name: 'nickname' });

	const onSubmit = (data: FormData) => {
		onJoin(data.nickname);
	};

	return (
		<div className="flex min-h-dvh w-full items-center justify-center overflow-auto bg-slate-800 p-4">
			<Card className="w-full max-w-md animate-scale-in rounded-2xl border-slate-600 bg-slate-700 shadow-2xl">
				<CardHeader className="text-center">
					<CardTitle className="font-display text-4xl text-white">Enter a Nickname</CardTitle>
				</CardHeader>
				<CardContent>
					<form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div>
							<Input
								{...register('nickname')}
								placeholder="Your cool name"
								className="h-16 border-slate-500 bg-slate-600 text-center text-2xl text-white placeholder:text-slate-400"
								disabled={isLoading}
								maxLength={LIMITS.NICKNAME_MAX}
								autoComplete="off"
							/>
							{errors.nickname && <p className="mt-2 text-center text-sm text-red-400">{errors.nickname.message}</p>}
						</div>
						<Button
							type="submit"
							className="w-full rounded-xl bg-quiz-orange py-6 text-xl hover:bg-quiz-orange/90"
							size="lg"
							disabled={isLoading || !isValid || !nickname?.trim()}
						>
							{isLoading ? 'Joining...' : 'Join Game'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
