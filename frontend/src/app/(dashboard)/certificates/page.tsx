// src/app/(dashboard)/certificates/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  PlusCircle,
  Calendar,
  Award,
  MoreVertical,
  User,
  Building,
  Briefcase,
  BookOpen,
  // Filter removido por não ser utilizado
  Download,
  Trash2,
  Edit,
  ExternalLink,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  thumbnail?: string;
  category?: string;
  skills: string[];
  isPublic: boolean;
}

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('all');
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Estado para carregar mais certificados
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    certificates,
    loading,
    error,
    getCertificates,
    deleteCertificate,
    filterCertificates,
  } = useCertificates();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    await getCertificates();
    setHasMore(true);
  };

  // Filtrando certificados
  const filteredCertificates = certificates.filter((cert) => {
    // Filtrar por texto
    const textMatch =
      cert.title.toLowerCase().includes(filter.toLowerCase()) ||
      cert.issuer.toLowerCase().includes(filter.toLowerCase()) ||
      cert.skills.some((skill) =>
        skill.toLowerCase().includes(filter.toLowerCase())
      );

    // Filtrar por categoria
    const categoryMatch =
      category === 'all' || 
      (cert.category && cert.category.toLowerCase() === category.toLowerCase());

    return textMatch && categoryMatch;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleDeleteCertificate = async (id: string) => {
    try {
      const success = await deleteCertificate(id);
      if (success) {
        toast({
          title: 'Certificado excluído',
          description: 'O certificado foi excluído com sucesso.',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro ao excluir o certificado';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleViewCertificate = (id: string) => {
    router.push(`/certificates/${id}`);
  };

  const handleEditCertificate = (id: string) => {
    router.push(`/certificates/${id}/edit`);
  };

  const handleShareCertificate = (certificateId: string) => {
    const shareUrl = `${window.location.origin}/certificates/share/${certificateId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copiado!',
      description: 'O link do certificado foi copiado para a área de transferência.',
    });
  };

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      // Simular carregamento de mais certificados (em produção, você faria uma chamada API)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Em produção, você carregaria a próxima página
      // const nextPage = page + 1;
      // const moreData = await loadMoreCertificates(nextPage);
      // Supondo que não há mais dados após a página 2 para este exemplo
      if (page >= 2) {
        setHasMore(false);
      } else {
        setPage((prev) => prev + 1);
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao carregar mais certificados:', error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleExportCertificates = () => {
    try {
      // Lógica para exportar certificados como CSV ou PDF
      if (process.env.NODE_ENV === 'development') {
        console.log('Exportando certificados...');
      }
      toast({
        title: 'Certificados exportados',
        description: 'Seus certificados foram exportados com sucesso.',
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao exportar certificados:', error);
      }
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao exportar os certificados',
        variant: 'destructive',
      });
    }
  };

  const handleImportCertificates = () => {
    try {
      // Lógica para importar certificados
      if (process.env.NODE_ENV === 'development') {
        console.log('Importando certificados...');
      }
      toast({
        title: 'Certificados importados',
        description: 'Seus certificados foram importados com sucesso.',
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao importar certificados:', error);
      }
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao importar os certificados',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCertificate = () => {
    router.push('/certificates/new');
  };

  // Vamos utilizar a lista de opções do menu em vez de declará-la e não usá-la
  const getMenuItems = (certificate: Certificate) => [
    {
      label: 'Visualizar',
      icon: <Eye className="w-4 h-4 mr-2" />,
      onClick: () => handleViewCertificate(certificate.id),
    },
    {
      label: 'Editar',
      icon: <Edit className="w-4 h-4 mr-2" />,
      onClick: () => handleEditCertificate(certificate.id),
    },
    {
      label: 'Compartilhar',
      icon: <ExternalLink className="w-4 h-4 mr-2" />,
      onClick: () => handleShareCertificate(certificate.id),
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4 mr-2" />,
      onClick: () => handleDeleteCertificate(certificate.id),
      isDanger: true,
    },
  ];

  // Renderizar certificados em visualização de grade
  const renderGridView = () => {
    if (loading && filteredCertificates.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-0 overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredCertificates.length === 0 && !loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Award className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhum certificado encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
            {filter
              ? `Não encontramos certificados correspondentes a "${filter}". Tente outro termo ou limpe o filtro.`
              : 'Você ainda não adicionou nenhum certificado. Comece adicionando seu primeiro certificado.'}
          </p>
          <Button onClick={handleCreateCertificate}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Certificado
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map((certificate) => (
          <Card
            key={certificate.id}
            className="p-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewCertificate(certificate.id)}
          >
            <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
              {certificate.thumbnail ? (
                <div className="relative w-full h-full">
                  <Image
                    src={certificate.thumbnail}
                    alt={certificate.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Award className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-semibold text-lg truncate">
                  {certificate.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {getMenuItems(certificate).map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        className={cn(
                          'flex items-center cursor-pointer',
                          item.isDanger && 'text-red-600 dark:text-red-400'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onClick();
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 flex items-center">
                <Building className="h-3.5 w-3.5 mr-1 inline" />
                {certificate.issuer}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {format(new Date(certificate.issueDate), 'dd MMM yyyy', { locale: ptBR })}
                </div>
                {certificate.category && (
                  <Badge variant="outline" className="text-xs">
                    {certificate.category}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Renderizar certificados em visualização de lista
  const renderListView = () => {
    if (loading && filteredCertificates.length === 0) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredCertificates.length === 0 && !loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Award className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhum certificado encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
            {filter
              ? `Não encontramos certificados correspondentes a "${filter}". Tente outro termo ou limpe o filtro.`
              : 'Você ainda não adicionou nenhum certificado. Comece adicionando seu primeiro certificado.'}
          </p>
          <Button onClick={handleCreateCertificate}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Certificado
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredCertificates.map((certificate) => (
          <Card
            key={certificate.id}
            className="p-4 hover:shadow-md transition-shadow"
            onClick={() => handleViewCertificate(certificate.id)}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {certificate.thumbnail ? (
                <div className="w-16 h-16 relative rounded-md overflow-hidden">
                  <Image
                    src={certificate.thumbnail}
                    alt={certificate.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <Award className="h-8 w-8 text-gray-500" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {certificate.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                  <Building className="h-3.5 w-3.5 mr-1 inline" />
                  {certificate.issuer}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {format(new Date(certificate.issueDate), 'dd MMM yyyy', { locale: ptBR })}
                  {certificate.expiryDate && (
                    <span className="ml-3">
                      • Expira em: {format(new Date(certificate.expiryDate), 'dd MMM yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 self-end md:self-center mt-2 md:mt-0">
                {certificate.category && (
                  <Badge variant="outline" className="text-xs">
                    {certificate.category}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {getMenuItems(certificate).map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        className={cn(
                          'flex items-center cursor-pointer',
                          item.isDanger && 'text-red-600 dark:text-red-400'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onClick();
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Certificados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie seus certificados, credenciais e qualificações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateCertificate}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {isMobile ? 'Adicionar' : 'Adicionar Certificado'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={isMobile ? 'icon' : 'default'}>
                {isMobile ? (
                  <MoreVertical className="h-4 w-4" />
                ) : (
                  <>
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Mais
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCertificates}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Certificados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportCertificates}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Certificados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all" onValueChange={handleCategoryChange}>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-4">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1.5 rounded-md"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger
                value="technology"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1.5 rounded-md"
              >
                Tecnologia
              </TabsTrigger>
              <TabsTrigger
                value="business"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1.5 rounded-md"
              >
                Negócios
              </TabsTrigger>
              <TabsTrigger
                value="education"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 py-1.5 rounded-md"
              >
                Educação
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar certificados..."
                  className="pl-8 w-full sm:w-64"
                  value={filter}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  variant={view === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('grid')}
                  title="Visualização em grade"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('list')}
                  title="Visualização em lista"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            {view === 'grid' ? renderGridView() : renderListView()}
          </TabsContent>

          <TabsContent value="technology" className="m-0">
            {view === 'grid' ? renderGridView() : renderListView()}
          </TabsContent>

          <TabsContent value="business" className="m-0">
            {view === 'grid' ? renderGridView() : renderListView()}
          </TabsContent>

          <TabsContent value="education" className="m-0">
            {view === 'grid' ? renderGridView() : renderListView()}
          </TabsContent>
        </Tabs>
      </div>

      {filteredCertificates.length > 0 && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore || !hasMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar mais'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}