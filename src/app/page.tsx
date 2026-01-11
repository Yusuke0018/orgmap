'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Check, Users, Share2, Zap, Loader2 } from 'lucide-react';
import { Button, Modal, Input, toast } from '@/components/common';
import { useUserStore } from '@/stores/userStore';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login, initAuth } = useUserStore();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleStart = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setShowNicknameModal(true);
    }
  };

  const handleSubmitNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsLoading(true);
    try {
      await login(nickname.trim());
      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast.error('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: '無料で使える',
      description: 'アカウント登録不要ですぐに始められます',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'ログイン不要で共有可能',
      description: 'URLを共有するだけで誰でも閲覧・編集できます',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Chatwork連携',
      description: 'Chatworkからメンバー情報を自動取得できます',
    },
  ];

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-[var(--primary)]" />
          <span className="text-xl font-bold text-[var(--text-primary)]">
            組織図エディタ
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
            チームの構造を
            <br className="md:hidden" />
            <span className="text-[var(--primary)]">マインドマップ</span>で
            <br />
            見える化
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            複数拠点・複数部署の組織図を簡単に作成・共有。
            <br className="hidden md:block" />
            誰がどの役職にいるかを一目で把握できます。
          </p>

          <Button
            size="lg"
            onClick={handleStart}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="text-lg px-8"
          >
            はじめる
          </Button>

          {/* Demo Image Placeholder */}
          <div className="mt-12 rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="flex justify-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                    院長
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm">
                      医師
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm">
                      看護
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-white text-xs">
                      A
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-white text-xs">
                      B
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-white text-xs">
                      C
                    </div>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  マインドマップ形式で組織構造を表示
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-[var(--primary)] mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Check className="w-5 h-5 text-[var(--success)]" />
                {feature.title}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Nickname Modal */}
      <Modal
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
        title="ニックネームを入力"
        size="sm"
      >
        <form onSubmit={handleSubmitNickname}>
          <p className="text-[var(--text-secondary)] mb-4">
            編集履歴に表示される名前を入力してください
          </p>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例: 田中"
            autoFocus
          />
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowNicknameModal(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isLoading}
              disabled={!nickname.trim()}
            >
              はじめる
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
