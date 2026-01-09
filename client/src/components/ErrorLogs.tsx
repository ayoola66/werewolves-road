import { useState } from 'react';
import { useErrorLog, ErrorLog } from '@/hooks/useErrorLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, CheckCircle2, XCircle, AlertCircle, Download, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ErrorLogs() {
  const {
    errors,
    isLoaded,
    isLoading,
    updateErrorStatus,
    deleteError,
    clearAllErrors,
    getErrorsByStatus,
    getNewErrorsCount,
    exportErrors,
  } = useErrorLog();

  const [selectedStatus, setSelectedStatus] = useState<'all' | ErrorLog['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  const getStatusBadgeVariant = (status: ErrorLog['status']) => {
    switch (status) {
      case 'new':
        return 'destructive';
      case 'investigating':
        return 'default';
      case 'resolved':
        return 'default';
      case 'ignored':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSourceBadgeVariant = (source: ErrorLog['source']) => {
    switch (source) {
      case 'edge-function':
        return 'destructive';
      case 'database':
        return 'destructive';
      case 'network':
        return 'default';
      default:
        return 'outline';
    }
  };

  const filteredErrors = errors.filter((error) => {
    const matchesStatus = selectedStatus === 'all' || error.status === selectedStatus;
    const functionName = (error as any).function_name || (error as any).functionName;
    const matchesSearch =
      searchQuery === '' ||
      error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      error.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      functionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (error as any).game_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const newErrorsCount = getNewErrorsCount();
  const resolvedErrors = getErrorsByStatus('resolved');
  const investigatingErrors = getErrorsByStatus('investigating');

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading error logs from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/40 via-red-900/50 to-black/70 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-black/60 border-purple-500/50 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Error Logs</CardTitle>
                <CardDescription className="text-gray-300">
                  Track and manage errors encountered during testing and gameplay
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={exportErrors}
                  className="border-purple-500/50 hover:bg-purple-500/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                {errors.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={clearAllErrors}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-red-900/30 border-red-500/50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-400">{newErrorsCount}</div>
                  <p className="text-sm text-gray-300">New Errors</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-900/30 border-yellow-500/50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-400">{investigatingErrors.length}</div>
                  <p className="text-sm text-gray-300">Investigating</p>
                </CardContent>
              </Card>
              <Card className="bg-green-900/30 border-green-500/50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-400">{resolvedErrors.length}</div>
                  <p className="text-sm text-gray-300">Resolved</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/30 border-gray-500/50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-400">{errors.length}</div>
                  <p className="text-sm text-gray-300">Total Errors</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/40 border-purple-500/50 text-white"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
                <SelectTrigger className="w-[200px] bg-black/40 border-purple-500/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error List */}
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 border-purple-500/50">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="details">Details View</TabsTrigger>
              </TabsList>
              <TabsContent value="list" className="mt-4">
                <ScrollArea className="h-[600px]">
                  {filteredErrors.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No errors found</p>
                      {errors.length === 0 && <p className="text-sm mt-2">All clear! No errors logged yet.</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredErrors.map((error) => (
                        <Card
                          key={error.id}
                          className="bg-black/40 border-purple-500/30 hover:border-purple-500/60 transition-colors"
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={getStatusBadgeVariant(error.status)}>
                                    {error.status}
                                  </Badge>
                                  <Badge variant={getSourceBadgeVariant(error.source)}>
                                    {error.source}
                                  </Badge>
                                  {(error.function_name || error.functionName) && (
                                    <Badge variant="outline">{error.function_name || error.functionName}</Badge>
                                  )}
                                  {error.game_code && (
                                    <Badge variant="outline" className="bg-purple-600/30">Game: {error.game_code}</Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-white mb-1">{error.message}</h3>
                                {error.details && (
                                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">{error.details}</p>
                                )}
                                {error.game_code && (
                                  <p className="text-xs text-purple-400 mb-1">Game Code: {error.game_code}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>{new Date(error.timestamp).toLocaleString()}</span>
                                  {(error.resolved_at || error.resolvedAt) && (
                                    <span className="text-green-400">
                                      Resolved: {new Date(error.resolved_at || error.resolvedAt || '').toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {error.notes && (
                                  <p className="text-sm text-gray-300 mt-2 italic">Note: {error.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedError(error)}
                                      className="text-purple-400 hover:text-purple-300"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-black border-purple-500/50 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Error Details</DialogTitle>
                                      <DialogDescription className="text-gray-300">
                                        Full error information and stack trace
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-semibold text-gray-400">Message</label>
                                        <p className="text-white">{error.message}</p>
                                      </div>
                                      {error.details && (
                                        <div>
                                          <label className="text-sm font-semibold text-gray-400">Details</label>
                                          <p className="text-white whitespace-pre-wrap">{error.details}</p>
                                        </div>
                                      )}
                                      {error.stack && (
                                        <div>
                                          <label className="text-sm font-semibold text-gray-400">Stack Trace</label>
                                          <pre className="text-xs bg-black/60 p-3 rounded overflow-x-auto text-gray-300">
                                            {error.stack}
                                          </pre>
                                        </div>
                                      )}
                                      {error.url && (
                                        <div>
                                          <label className="text-sm font-semibold text-gray-400">URL</label>
                                          <p className="text-white text-sm break-all">{error.url}</p>
                                        </div>
                                      )}
                                      {error.notes && (
                                        <div>
                                          <label className="text-sm font-semibold text-gray-400">Notes</label>
                                          <p className="text-white">{error.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {error.status !== 'resolved' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateErrorStatus(error.id, 'resolved')}
                                    className="text-green-400 hover:text-green-300"
                                    title="Mark as resolved"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {error.status !== 'ignored' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateErrorStatus(error.id, 'ignored')}
                                    className="text-gray-400 hover:text-gray-300"
                                    title="Ignore"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteError(error.id)}
                                  className="text-red-400 hover:text-red-300"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="details" className="mt-4">
                <ScrollArea className="h-[600px]">
                  {filteredErrors.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No errors found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredErrors.map((error) => (
                        <Card key={error.id} className="bg-black/40 border-purple-500/30">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{error.message}</CardTitle>
                                <CardDescription className="text-gray-400">
                                  {new Date(error.timestamp).toLocaleString()}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={getStatusBadgeVariant(error.status)}>{error.status}</Badge>
                                <Badge variant={getSourceBadgeVariant(error.source)}>{error.source}</Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {error.details && (
                              <div>
                                <label className="text-sm font-semibold text-gray-400">Details</label>
                                <p className="text-white whitespace-pre-wrap">{error.details}</p>
                              </div>
                            )}
                            {error.functionName && (
                              <div>
                                <label className="text-sm font-semibold text-gray-400">Function</label>
                                <p className="text-white">{error.functionName}</p>
                              </div>
                            )}
                            {error.stack && (
                              <div>
                                <label className="text-sm font-semibold text-gray-400">Stack Trace</label>
                                <pre className="text-xs bg-black/60 p-3 rounded overflow-x-auto text-gray-300">
                                  {error.stack}
                                </pre>
                              </div>
                            )}
                            {error.url && (
                              <div>
                                <label className="text-sm font-semibold text-gray-400">URL</label>
                                <p className="text-white text-sm break-all">{error.url}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2 border-t border-purple-500/30">
                              <Select
                                value={error.status}
                                onValueChange={(value) =>
                                  updateErrorStatus(error.id, value as ErrorLog['status'])
                                }
                              >
                                <SelectTrigger className="w-[180px] bg-black/40 border-purple-500/50 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-purple-500/50">
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="investigating">Investigating</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="ignored">Ignored</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteError(error.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
