using Microsoft.EntityFrameworkCore;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class PageExtensions
    {
        public static IQueryable<TSource> Subset<TSource>(this IQueryable<TSource> superset, Page page)
        {
            var source = (page.SkippedItems > 0 ? superset.Skip(page.SkippedItems).Take(page.PageSize) : superset.Take(page.PageSize));
            return source;
        }
    }

    public class Page
    {
        public Page(int pageNumber, int pageSize, int totalItems)
        {
            if (pageNumber < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(pageNumber), pageNumber, $"{nameof(pageNumber)} cannot be less than 1.");
            }

            if (pageSize < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(pageSize), pageSize, $"{nameof(pageSize)} cannot be less than 1.");
            }

            if (totalItems < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(totalItems), totalItems, $"{nameof(totalItems)} cannot be less than 0.");
            }

            var totalPages = totalItems > 0 ? (int)Math.Ceiling(totalItems / (double)pageSize) : 0;
            var skippedItems = pageNumber == 1 ? 0 : (pageNumber - 1) * pageSize;
            var pageNumberExists = totalPages > 0 && pageNumber <= totalPages;

            var numberOfFirstItemOnPage = (pageNumber - 1) * pageSize + 1;
            var numberOfLastItemOnPage = numberOfFirstItemOnPage + pageSize - 1;


            FirstItemOnPage = pageNumberExists ? numberOfFirstItemOnPage : 0;
            LastItemOnPage = pageNumberExists ? (numberOfLastItemOnPage > totalItems ? totalItems : numberOfLastItemOnPage) : 0;

            HasPreviousPage = pageNumberExists && pageNumber > 1;
            HasNextPage = pageNumberExists && pageNumber < totalPages;

            IsFirstPage = pageNumberExists && pageNumber == 1;
            IsLastPage = pageNumberExists && pageNumber == totalPages;

            TotalPages = totalPages;
            TotalItems = totalItems;
            SkippedItems = skippedItems;

            PageNumber = pageNumber;
            PageSize = pageSize;
        }

        public int PageNumber { get; set; }

        public int PageSize { get; set; }

        public int TotalPages { get; set; }

        public int TotalItems { get; set; }

        public int SkippedItems { get; set; }

        public bool HasPreviousPage { get; set; }

        public bool HasNextPage { get; set; }

        public bool IsFirstPage { get; set; }

        public bool IsLastPage { get; set; }

        public int FirstItemOnPage { get; set; }

        public int LastItemOnPage { get; set; }
    }
}