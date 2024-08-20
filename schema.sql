CREATE TABLE users (
    id uuid PRIMARY KEY,
    default_team_id uuid,
    created_at timestamp with time zone,
    email text
);

CREATE TABLE teams (
    id uuid PRIMARY KEY,
    created_at timestamp with time zone,
    name text
);

CREATE TABLE team_members (
    id uuid PRIMARY KEY,
    team_id uuid,
    user_id uuid,
    created_at timestamp with time zone,
    email text,
    role text,
    status text,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE invitations (
    id uuid PRIMARY KEY,
    team_id uuid,
    created_at timestamp with time zone,
    role text,
    status text,
    email text,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);


/****************************
EXTENDED
****************************/
CREATE TABLE projects (
    id uuid PRIMARY KEY,
    team_id uuid REFERENCES teams(id),
    user_id uuid REFERENCES users(id),
    created_at timestamp with time zone,
    name text,
    description text,
    slug text,
    visibility text
);

CREATE TABLE features (
    id uuid PRIMARY KEY,
    project_id uuid REFERENCES projects(id),
    order bigint,
    created_at timestamp with time zone,
    name text
);

CREATE TABLE tasks (
    id uuid PRIMARY KEY,
    feature_id uuid REFERENCES features(id),
    progress integer,
    created_at timestamp with time zone,
    name text
);