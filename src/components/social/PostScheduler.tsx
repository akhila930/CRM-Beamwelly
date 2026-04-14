import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PostScheduler() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Post Scheduler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground text-center">
            We're working hard to bring you the post scheduling feature. Stay tuned!
          </p>
              </div>
            </CardContent>
          </Card>
  );
}
