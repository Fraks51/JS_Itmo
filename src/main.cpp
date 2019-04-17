#include <iostream>
#include <vector>
#include <ctime>
#include <random>
#include <cstdlib>

using namespace std;

//im treap

struct im_treap {
    int value = 0;
    int count = 1;
    long long y;
    im_treap * left = nullptr;
    im_treap * right = nullptr;
};

int look_count (im_treap * t) {
    return t ? t->count : 0;
}

im_treap * update_weight (im_treap * t) {
    if (t)
        t->count = 1 + look_count(t->left) + look_count(t->right);
    return t;
}

im_treap * im_merge (im_treap * t1, im_treap * t2) {
    if (t2 == nullptr) return t1;
    if (t1 == nullptr) return t2;
    if (t1->y < t2->y) {
        t1->right = im_merge(t1->right, t2);
        t1 = update_weight(t1);
        return t1;
    } else {
        t2->left = im_merge(t1, t2->left);
        t2 = update_weight(t2);
        return t2;
    }
}

im_treap * im_reset(int value, int pos, im_treap * t) {
    if (look_count(t->left) == pos) {
        t->value = value;
        return t;
    }
    if (look_count(t->left) > pos)
        t->left = im_reset(value, pos, t->left);
    else
        t->right = im_reset(value, pos - (look_count(t->left) + 1), t->right);
    return t;
}


pair <im_treap *, im_treap *> im_split(im_treap * t, int k) {
    if (t == nullptr) return make_pair(nullptr, nullptr);
    int l = look_count(t->left);
    if (l >= k) {
        pair <im_treap *, im_treap *> tmp_pair = im_split(t->left, k);
        t->left = tmp_pair.second;
        t = update_weight(t);
        return make_pair(tmp_pair.first, t);
    } else {
        pair <im_treap *, im_treap *> tmp_pair = im_split(t->right, k - l - 1);
        t->right = tmp_pair.first;
        t = update_weight(t);
        return make_pair(t, tmp_pair.second);
    }
}

im_treap * insert(int value, int pos, int y, im_treap * t) {
    pair <im_treap *, im_treap *> tmp_pair = im_split(t, pos);
    auto root = new(im_treap);
    root->left = tmp_pair.first;
    root->right = tmp_pair.second;
    root->value = value;
    root->y = y;
    root = update_weight(root);
    return root;
}

im_treap * im_remove(int pos, im_treap * t) {
    if (look_count(t->left) == pos) { 
        t = im_merge(t->left, t->right);
        t = update_weight(t);
        return t;
    }
    if (look_count(t->left) > pos) {
        t->left = im_remove(pos, t->left);
    } else {
        t->right = im_remove(pos - (look_count(t->left) + 1), t->right);
    }
    t = update_weight(t);
    return t;
}

im_treap * build_tree(int n, long long y = 200) {
    if (n == 0) {
        return nullptr;
    }
    auto * t = new(im_treap);
    t->y = y;
    int n2 = n/2;
    t->left = build_tree(n - n2 - 1, y + rand() % 30000);
    t->right = build_tree(n2, (y + rand() % 50000));
    t->count = n;
    return t;
}
int max_pos = 1;
int count = 0;
void f(im_treap * t) {
    if (t == nullptr) {
        return;
    }
    f(t->left);
    if (count >= max_pos) {
        return;
    }
    count++;
    cout << t->value << " ";
    f(t->right);
}

vector <int> id;

int find_set(int i) {
    if (id[i] == i) {
        return i;
    }
    id[i] = find_set(id[i]);
    return id[i];
}


int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    int n, m;
    srand ( time(NULL) );
    cin >> n >> m;
    id.resize(n + m + 1);
    im_treap * ans_array = nullptr;
    for (int i = 1; i <= m + n; i++) {
        id[i] = i;
    }
    ans_array = build_tree(n + m);
    int tmp;
    for (int i = 1; i <= n; i++) {
        cin >> tmp;
        if (id[tmp] == tmp) {
            id[tmp] = find_set(tmp + 1);;
            max_pos = max(tmp, max_pos);;
            ans_array = im_reset(i, tmp - 1, ans_array);
        } else {
            int next_node = find_set(tmp);
            id[next_node] = find_set(next_node + 1);
            max_pos = max(next_node, max_pos);
            ans_array = im_remove(next_node - 1, ans_array);
            ans_array = insert(i, tmp - 1, rand(), ans_array);
        }
    }
    cout << max_pos << endl;
    f(ans_array);
}
