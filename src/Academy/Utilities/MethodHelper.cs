using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    // get methodinfo from a method reference C#
    // source: https://stackoverflow.com/questions/9382216/get-methodinfo-from-a-method-reference-c-sharp
    public static class MethodHelper
    {
        // No cast necessary
        public static MethodInfo GetMethodInfo(Action action) => action.Method;
        public static MethodInfo GetMethodInfo<T>(Action<T> action) => action.Method;
        public static MethodInfo GetMethodInfo<T1, T2>(Action<T1, T2> action) => action.Method;

        public static MethodInfo GetMethodInfo<TResult>(Func<TResult> fun) => fun.Method;
        public static MethodInfo GetMethodInfo<T, TResult>(Func<T, TResult> fun) => fun.Method;
        public static MethodInfo GetMethodInfo<T1, T2, TResult>(Func<T1, T2, TResult> fun) => fun.Method;

        // Cast necessary
        public static MethodInfo GetMethodInfo(Delegate del) => del.Method;
    }
}
