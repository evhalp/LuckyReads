import { createElement, type ReactElement } from "react";
import {
    createBrowserRouter,
    Navigate,
    type RouteObject,
} from "react-router-dom";
import ForgotPassword from "./pages/forgot-password";
import Login from "./pages/login";
import Onboarding from "./pages/onboarding";
import MyShelf from "./pages/MyShelf";
import Home from "./pages/Home";
import FindReaders from "./pages/FindReaders";
import Profile from "./pages/Profile";
import { isAuthenticated } from "./session";

function AuthRedirect() {
    return <Navigate to={isAuthenticated() ? "/home" : "/login"} replace />;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
    if (isAuthenticated()) {
        return <Navigate to="/home" replace />;
    }

    return children;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export const routes: RouteObject[] = [
    {
        path: "/",
        element: createElement(AuthRedirect),
    },
    {
        path: "/login",
        element: createElement(PublicOnlyRoute, {
            children: createElement(Login),
        }),
    },
    {
        path: "/forgot-password",
        element: createElement(PublicOnlyRoute, {
            children: createElement(ForgotPassword),
        }),
    },
    {
        path: "/onboarding",
        element: createElement(Navigate, { to: "/signup", replace: true }),
    },
    {
        path: "/signup",
        element: createElement(PublicOnlyRoute, {
            children: createElement(Onboarding),
        }),
    },
    {
        path: "/home",
        element: createElement(ProtectedRoute, {
            children: createElement(Home),
        }),
    },
    {
        path: "/my-shelf",
        element: createElement(ProtectedRoute, {
            children: createElement(MyShelf),
        }),
    },
    {
        path: "/find-readers",
        element: createElement(ProtectedRoute, {
            children: createElement(FindReaders),
        }),
    },
    {
        path: "/profile",
        element: createElement(ProtectedRoute, {
            children: createElement(Profile),
        }),
    },
];

export const router = createBrowserRouter(routes);
