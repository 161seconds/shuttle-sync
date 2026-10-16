namespace ShuttleSync.Test;
public static class TestAssert
{
    public static async Task ThrowsAsync<T>(Func<Task> action, string message)
        where T : Exception
    {
        var error = await Record.ExceptionAsync(action);
        Assert.True(error is T, $"{message}: expected {typeof(T).Name}, got {error?.GetType().Name ?? "no exception"}");
    }
}
