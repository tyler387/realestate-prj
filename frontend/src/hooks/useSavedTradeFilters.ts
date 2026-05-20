import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tradeFilterApi } from '../services/tradeFilterService'

const QUERY_KEY = ['trade', 'savedFilters'] as const

export const useSavedTradeFilters = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => tradeFilterApi.list(),
    staleTime: 1000 * 60,
    enabled,
  })

export const useCreateSavedTradeFilter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, payload }: { name: string; payload: string }) =>
      tradeFilterApi.create(name, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export const useUpdateSavedTradeFilter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, payload }: { id: number; name: string; payload: string }) =>
      tradeFilterApi.update(id, name, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export const useDeleteSavedTradeFilter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tradeFilterApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
