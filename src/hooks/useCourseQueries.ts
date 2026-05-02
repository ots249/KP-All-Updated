import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../lib/api';
import { WebsiteConfig, CourseData } from '../types';

export const useConfig = () => {
  return useQuery({
    queryKey: ['config'],
    queryFn: ({ signal }) => API.fetchConfig(signal),
  });
};

export const useCourseData = (url: string | undefined) => {
  return useQuery({
    queryKey: ['course', url],
    queryFn: ({ signal }) => API.fetchCourseData(url!, signal),
    enabled: !!url,
  });
};

export const useUpdateConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: WebsiteConfig) => API.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });
};
