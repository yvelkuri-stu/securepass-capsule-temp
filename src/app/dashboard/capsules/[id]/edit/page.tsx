//src/app/dashboard/capsules/[id]/edit/page.tsx

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AIEnhancedCapsuleForm } from '@/components/capsules/ai-enhanced-capsule-form'
import { useCapsuleStore } from '@/store/capsules'
import { toast } from 'sonner'
import { SecureCapsule } from '@/lib/secure-capsules'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditCapsulePage() {
  const router = useRouter()
  const params = useParams()
  const capsuleId = params.id as string

  const { capsules, getCapsule, updateCapsule } = useCapsuleStore()
  const [capsuleToEdit, setCapsuleToEdit] = useState<SecureCapsule | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadCapsule = async () => {
      setIsLoading(true);
      let capsule = capsules.find(c => c.id === capsuleId)
      if (capsule) {
        setCapsuleToEdit(capsule)
      } else {
        try {
          capsule = await getCapsule(capsuleId);
          setCapsuleToEdit(capsule);
        } catch (error) {
            toast.error("Failed to load capsule for editing.");
            router.push('/dashboard/capsules');
        }
      }
      setIsLoading(false);
    }
    if (capsuleId) {
      loadCapsule()
    }
  }, [capsuleId, capsules, getCapsule, router])

  const handleSubmit = async (data: any) => {
    if (!capsuleToEdit) return;
    setIsLoading(true);

    const updates = {
        title: data.title,
        description: data.description,
        content: { text: data.content },
        dataTypes: capsuleToEdit.dataTypes,
        metadata: {
            ...capsuleToEdit.metadata,
            tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            securityLevel: data.securityLevel,
        },
        security: {
            ...capsuleToEdit.security,
            passwordProtected: data.enablePasswordProtection,
            encryptionEnabled: data.enablePasswordProtection
        },
        sharing: capsuleToEdit.sharing,
        lastAccessedAt: new Date()
    };

    try {
      await updateCapsule(capsuleId, updates, data.enablePasswordProtection ? data.password : undefined);
      toast.success('Capsule updated successfully!');
      router.push(`/dashboard/capsules/${capsuleId}`);
    } catch (error: any) {
      toast.error(`Failed to update capsule: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initialFormData = useMemo(() => {
    if (!capsuleToEdit) return undefined;
    return {
        title: capsuleToEdit.title,
        description: capsuleToEdit.description || '',
        content: (capsuleToEdit.content as any)?.text || '',
        tags: capsuleToEdit.metadata.tags.join(', '),
        securityLevel: capsuleToEdit.metadata.securityLevel,
        enablePasswordProtection: capsuleToEdit.security.passwordProtected,
        password: '',
    }
  }, [capsuleToEdit])

  if (isLoading || !capsuleToEdit || !initialFormData) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Capsule</h1>
          <p className="text-muted-foreground">Modify your secure data capsule</p>
        </div>
      </div>
      <AIEnhancedCapsuleForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialData={initialFormData}
      />
    </div>
  )
}
