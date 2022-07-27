using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading.Tasks.Dataflow;

namespace Academy.Utilities
{
    public static class EnumerableExtensions
    {
        public static IEnumerable<IEnumerable<T>> Split<T>(this IEnumerable<T> superset, int numberOfPages)
        {
            int take = Convert.ToInt32(Math.Ceiling(superset.Count() / (double)numberOfPages));

            var result = new List<IEnumerable<T>>();

            for (int i = 0; i < numberOfPages; i++)
            {
                var chunk = superset.Skip(i * take).Take(take).ToList();

                if (chunk.Any())
                {
                    result.Add(chunk);
                };
            }

            return result;
        }

        // JavaScript splice in c#
        // source: https://stackoverflow.com/questions/28833373/javascript-splice-in-c-sharp
        public static List<T> Splice<T>(this List<T> source, int index, int count, params T[] newItems)
        {
            var removeItems = source.Skip(index).Take(count).ToList();

            if (source.Count >= count)
                source.RemoveRange(index, count);

            if (newItems != null && newItems.Length != 0)
                source.InsertRange(index, newItems);

            return removeItems;
        }

        // foreach with index [duplicate]
        // source: https://stackoverflow.com/questions/521687/foreach-with-index
        public static void ForEach<T>(this IEnumerable<T> ie, Action<T, int> action)
        {
            var i = 0;
            foreach (var e in ie) action(e, i++);
        }

        // How to replace list item in best way
        // source: https://stackoverflow.com/questions/17188966/how-to-replace-list-item-in-best-way
        public static int Replace<T>(this IList<T> source, T oldValue, T newValue)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            var index = source.IndexOf(oldValue);
            if (index != -1)
                source[index] = newValue;
            return index;
        }

        public static void ReplaceAll<T>(this IList<T> source, T oldValue, T newValue)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            int index = -1;
            do
            {
                index = source.IndexOf(oldValue);
                if (index != -1)
                    source[index] = newValue;
            } while (index != -1);
        }

        public static IEnumerable<T> Replace<T>(this IEnumerable<T> source, T oldValue, T newValue)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            return source.Select(x => EqualityComparer<T>.Default.Equals(x, oldValue) ? newValue : x);
        }

        public static IEnumerable<IEnumerable<T>> Partition<T>(this IEnumerable<T> superset, int pageSize)
        {
            // Cache this to avoid evaluating it twice
            int count = superset.Count();

            if (count < pageSize)
            {
                yield return superset;
            }
            else
            {
                var numberOfPages = Math.Ceiling(count / (double)pageSize);

                for (var i = 0; i < numberOfPages; i++)
                {
                    yield return superset.Skip(pageSize * i).Take(pageSize);
                }
            }
        }

        // ForEachAsync extension method (a way to run an async operation on each item of a sequence in parallel)
        // source: https://codereview.stackexchange.com/questions/203150/foreachasync-extension-method-a-way-to-run-an-async-operation-on-each-item-of-a
        public static Task ForEachAsync<TSource>(
            this IEnumerable<TSource> items,
            Func<TSource, Task> action,
            int maxDegreesOfParallelism = 1)
        {
            var actionBlock = new ActionBlock<TSource>(action, new ExecutionDataflowBlockOptions
            {
                MaxDegreeOfParallelism = maxDegreesOfParallelism
            });

            foreach (var item in items)
            {
                actionBlock.Post(item);
            }

            actionBlock.Complete();

            return actionBlock.Completion;
        }

        public static async Task<IEnumerable<TResult>> SelectAsync<TSource, TResult>(
            this IEnumerable<TSource> items, 
            Func<TSource, Task<TResult>> action,
            int maxDegreesOfParallelism = 1)
        {
            var transformBlock = new TransformBlock<TSource, TResult>(action, new ExecutionDataflowBlockOptions
            {
                MaxDegreeOfParallelism = maxDegreesOfParallelism
            });

            var bufferBlock = new BufferBlock<TResult>();

            using (transformBlock.LinkTo(bufferBlock, new DataflowLinkOptions { PropagateCompletion = true }))
            {
                foreach (var item in items)
                {
                    transformBlock.Post(item);
                }

                transformBlock.Complete();
                await transformBlock.Completion;
            }

            bufferBlock.TryReceiveAll(out var result);
            return result ?? Enumerable.Empty<TResult>();
        }
    }
}