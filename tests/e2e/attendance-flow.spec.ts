import{test,expect}from"@playwright/test";

test("admin can sign in and reach the dashboard",async({page})=>{
 await page.goto("/login");
 await expect(page.getByRole("heading",{name:"Welcome back"})).toBeVisible();
 await page.getByPlaceholder("Username").fill("admin");
 await page.getByPlaceholder("Password").fill("ChangeMe123!");
 await page.getByRole("button",{name:"Sign in"}).click();
 await expect(page).toHaveURL(/\/dashboard$/);
 await expect(page.getByText("Total Students")).toBeVisible();
});

test("attendance page exposes mobile-safe attendance controls",async({page})=>{
 await page.goto("/login");
 await page.getByPlaceholder("Username").fill("admin");
 await page.getByPlaceholder("Password").fill("ChangeMe123!");
 await page.getByRole("button",{name:"Sign in"}).click();
 await page.goto("/attendance");
 await expect(page.getByText("Take attendance")).toBeVisible();
 await expect(page.getByText(/ONLINE|OFFLINE/)).toBeVisible();
 await expect(page.getByRole("button",{name:/SAVE (ATTENDANCE|OFFLINE)/})).toBeVisible();
});